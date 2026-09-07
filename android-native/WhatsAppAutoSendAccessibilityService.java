package com.solholo.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.graphics.Rect;
import android.os.Handler;
import android.os.Looper;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Toast;

import java.util.ArrayDeque;
import java.util.List;
import java.util.Queue;

/**
 * Narrow, deterministic accessibility action for one owner-requested
 * WhatsApp message. The service ignores every package except the exact
 * WhatsApp package stored in the short-lived command and refuses to click
 * unless recipient, draft text and send control all match.
 */
public class WhatsAppAutoSendAccessibilityService extends AccessibilityService {
    private static final int MAX_VISITED_NODES = 600;
    private static final long RETRY_INTERVAL_MS = 180L;
    private static final int MAX_CLICKABLE_ANCESTOR_DEPTH = 3;
    private static volatile WhatsAppAutoSendAccessibilityService activeInstance;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private String scheduledExpiryToken = "";
    private String scheduledRetryToken = "";

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        activeInstance = this;

        AccessibilityServiceInfo info = getServiceInfo();
        if (info != null) {
            info.flags |= AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;
            info.flags |= AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
            setServiceInfo(info);
        }
        wakeForPendingCommand();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        WhatsAppAutoSendCommand.Pending pending =
            WhatsAppAutoSendCommand.peek();
        if (pending == null || event == null) {
            return;
        }

        CharSequence eventPackage = event.getPackageName();
        if (
            eventPackage == null
                || !pending.packageName.contentEquals(eventPackage)
        ) {
            return;
        }

        scheduleExpiry(pending);
        attemptCurrentCommand();
        scheduleRetryIfPending(pending);
    }

    @Override
    public void onInterrupt() {
        cancelCurrentCommand("accessibility_interrupted");
    }

    @Override
    public void onDestroy() {
        if (activeInstance == this) {
            activeInstance = null;
        }
        cancelCurrentCommand("accessibility_stopped");
        mainHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    public static void wakeForPendingCommand() {
        WhatsAppAutoSendAccessibilityService instance = activeInstance;
        if (instance == null) {
            return;
        }
        instance.mainHandler.post(() -> {
            WhatsAppAutoSendCommand.Pending pending =
                WhatsAppAutoSendCommand.peek();
            if (pending == null) {
                return;
            }
            instance.scheduleExpiry(pending);
            instance.attemptCurrentCommand();
            instance.scheduleRetryIfPending(pending);
        });
    }

    private void scheduleExpiry(WhatsAppAutoSendCommand.Pending pending) {
        if (pending.token.equals(scheduledExpiryToken)) {
            return;
        }
        scheduledExpiryToken = pending.token;
        long delay = Math.max(
            1L,
            pending.expiresAtMillis - WhatsAppAutoSendCommand.nowMillis() + 1L
        );
        mainHandler.postDelayed(() -> {
            WhatsAppAutoSendCommand.Pending expired =
                WhatsAppAutoSendCommand.cancel(pending.token);
            if (expired == null) {
                return;
            }
            scheduledExpiryToken = "";
            scheduledRetryToken = "";
            publishResult(expired, false, "verification_timeout");
            showResult(
                "Nicht automatisch gesendet: WhatsApp konnte nicht sicher geprüft werden."
            );
        }, delay);
    }

    private void scheduleRetryIfPending(
        WhatsAppAutoSendCommand.Pending expected
    ) {
        WhatsAppAutoSendCommand.Pending active =
            WhatsAppAutoSendCommand.peek();
        if (
            active == null
                || !active.token.equals(expected.token)
                || expected.token.equals(scheduledRetryToken)
        ) {
            return;
        }

        scheduledRetryToken = expected.token;
        mainHandler.postDelayed(() -> {
            if (!expected.token.equals(scheduledRetryToken)) {
                return;
            }
            scheduledRetryToken = "";

            WhatsAppAutoSendCommand.Pending stillActive =
                WhatsAppAutoSendCommand.peek();
            if (
                stillActive == null
                    || !stillActive.token.equals(expected.token)
            ) {
                return;
            }

            attemptCurrentCommand();
            scheduleRetryIfPending(stillActive);
        }, RETRY_INTERVAL_MS);
    }

    private void attemptCurrentCommand() {
        WhatsAppAutoSendCommand.Pending pending =
            WhatsAppAutoSendCommand.peek();
        if (pending == null) {
            return;
        }

        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null || root.getPackageName() == null) {
            return;
        }
        if (!pending.packageName.contentEquals(root.getPackageName())) {
            return;
        }

        AccessibilityNodeInfo entry = findExactDraft(root, pending);
        AccessibilityNodeInfo recipient = findRecipientEvidence(root, pending);
        AccessibilityNodeInfo send = findSendControl(root, pending.packageName);
        if (entry == null || recipient == null || send == null) {
            return;
        }

        WhatsAppAutoSendCommand.Pending claimed =
            WhatsAppAutoSendCommand.claim(pending.token);
        if (claimed == null) {
            return;
        }
        scheduledExpiryToken = "";
        scheduledRetryToken = "";

        boolean clicked;
        try {
            clicked = send.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        } catch (RuntimeException error) {
            clicked = false;
        }

        publishResult(
            claimed,
            clicked,
            clicked ? "send_control_activated" : "send_control_rejected"
        );
        showResult(
            clicked
                ? "WhatsApp an " + claimed.recipientName + " automatisch gesendet."
                : "Nicht automatisch gesendet: WhatsApp hat den Sendeauftrag abgelehnt."
        );
    }

    private AccessibilityNodeInfo findExactDraft(
        AccessibilityNodeInfo root,
        WhatsAppAutoSendCommand.Pending pending
    ) {
        for (String id : new String[] {
            "entry",
            "message_entry",
            "conversation_entry"
        }) {
            AccessibilityNodeInfo node = firstMatchingViewId(
                root,
                pending.packageName + ":id/" + id,
                candidate -> isExactEditableDraft(candidate, pending.message)
            );
            if (node != null) {
                return node;
            }
        }

        return firstBreadthFirst(
            root,
            candidate -> isExactEditableDraft(candidate, pending.message)
        );
    }

    private boolean isExactEditableDraft(
        AccessibilityNodeInfo node,
        String message
    ) {
        if (node == null || !node.isVisibleToUser()) {
            return false;
        }
        CharSequence className = node.getClassName();
        boolean editable = node.isEditable()
            || (
                className != null
                    && className.toString().contains("EditText")
            );
        return editable
            && WhatsAppAutoSendCommand.exactMessage(node.getText(), message);
    }

    private AccessibilityNodeInfo findRecipientEvidence(
        AccessibilityNodeInfo root,
        WhatsAppAutoSendCommand.Pending pending
    ) {
        for (String id : new String[] {
            "conversation_contact_name",
            "conversation_contact",
            "contact_name",
            "toolbar_title"
        }) {
            AccessibilityNodeInfo node = firstMatchingViewId(
                root,
                pending.packageName + ":id/" + id,
                candidate -> nodeMatchesRecipient(candidate, pending)
            );
            if (node != null) {
                return node;
            }
        }

        Rect rootBounds = new Rect();
        root.getBoundsInScreen(rootBounds);
        int topLimit = rootBounds.top
            + Math.max(1, rootBounds.height() / 3);
        return firstBreadthFirst(root, candidate -> {
            if (!nodeMatchesRecipient(candidate, pending)) {
                return false;
            }
            Rect bounds = new Rect();
            candidate.getBoundsInScreen(bounds);
            return !bounds.isEmpty() && bounds.bottom <= topLimit;
        });
    }

    private boolean nodeMatchesRecipient(
        AccessibilityNodeInfo node,
        WhatsAppAutoSendCommand.Pending pending
    ) {
        if (node == null || !node.isVisibleToUser()) {
            return false;
        }
        return WhatsAppAutoSendCommand.matchesRecipientEvidence(
            node.getText(),
            pending.recipientName,
            pending.phoneDigits
        ) || WhatsAppAutoSendCommand.matchesRecipientEvidence(
            node.getContentDescription(),
            pending.recipientName,
            pending.phoneDigits
        );
    }

    private AccessibilityNodeInfo findSendControl(
        AccessibilityNodeInfo root,
        String packageName
    ) {
        for (String id : new String[] { "send", "send_button" }) {
            AccessibilityNodeInfo node = firstMatchingViewId(
                root,
                packageName + ":id/" + id,
                this::isVisibleAndEnabled
            );
            AccessibilityNodeInfo clickable =
                clickableSelfOrAncestor(node);
            if (clickable != null) {
                return clickable;
            }
        }

        AccessibilityNodeInfo labeled = firstBreadthFirst(
            root,
            this::hasSendControlLabel
        );
        return clickableSelfOrAncestor(labeled);
    }

    private boolean isVisibleAndEnabled(AccessibilityNodeInfo node) {
        return node != null && node.isVisibleToUser() && node.isEnabled();
    }

    private boolean hasSendControlLabel(AccessibilityNodeInfo node) {
        if (!isVisibleAndEnabled(node)) {
            return false;
        }
        return WhatsAppAutoSendCommand.matchesSendLabel(
            node.getContentDescription()
        ) || WhatsAppAutoSendCommand.matchesSendLabel(node.getText());
    }

    private AccessibilityNodeInfo clickableSelfOrAncestor(
        AccessibilityNodeInfo node
    ) {
        AccessibilityNodeInfo candidate = node;
        for (
            int depth = 0;
            candidate != null && depth <= MAX_CLICKABLE_ANCESTOR_DEPTH;
            depth += 1
        ) {
            if (
                isVisibleAndEnabled(candidate)
                    && candidate.isClickable()
            ) {
                return candidate;
            }
            candidate = candidate.getParent();
        }
        return null;
    }

    private AccessibilityNodeInfo firstMatchingViewId(
        AccessibilityNodeInfo root,
        String viewId,
        NodePredicate predicate
    ) {
        List<AccessibilityNodeInfo> nodes;
        try {
            nodes = root.findAccessibilityNodeInfosByViewId(viewId);
        } catch (RuntimeException error) {
            return null;
        }
        if (nodes == null) {
            return null;
        }
        for (AccessibilityNodeInfo node : nodes) {
            if (predicate.matches(node)) {
                return node;
            }
        }
        return null;
    }

    private AccessibilityNodeInfo firstBreadthFirst(
        AccessibilityNodeInfo root,
        NodePredicate predicate
    ) {
        Queue<AccessibilityNodeInfo> queue = new ArrayDeque<>();
        queue.add(root);
        int visited = 0;
        while (!queue.isEmpty() && visited < MAX_VISITED_NODES) {
            AccessibilityNodeInfo node = queue.remove();
            visited += 1;
            if (predicate.matches(node)) {
                return node;
            }
            int childCount = node.getChildCount();
            for (int index = 0; index < childCount; index += 1) {
                AccessibilityNodeInfo child = node.getChild(index);
                if (child != null) {
                    queue.add(child);
                }
            }
        }
        return null;
    }

    private void cancelCurrentCommand(String reason) {
        WhatsAppAutoSendCommand.Pending pending =
            WhatsAppAutoSendCommand.peek();
        if (pending == null) {
            return;
        }
        WhatsAppAutoSendCommand.Pending cancelled =
            WhatsAppAutoSendCommand.cancel(pending.token);
        if (cancelled != null) {
            scheduledExpiryToken = "";
            scheduledRetryToken = "";
            publishResult(cancelled, false, reason);
        }
    }

    private void publishResult(
        WhatsAppAutoSendCommand.Pending pending,
        boolean sendControlActivated,
        String reason
    ) {
        PhoneContactsPlugin.publishWhatsAppAutoSendResult(
            pending.token,
            pending.recipientName,
            sendControlActivated,
            reason
        );
    }

    private void showResult(String message) {
        Toast.makeText(
            getApplicationContext(),
            message,
            Toast.LENGTH_LONG
        ).show();
    }

    private interface NodePredicate {
        boolean matches(AccessibilityNodeInfo node);
    }
}
