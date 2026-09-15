package com.solholo.app;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.service.voice.VoiceInteractionSession;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/** A small, honest assistant surface that opens the full Human Holo app. */
public final class HumanHoloVoiceInteractionSession
    extends VoiceInteractionSession {
    private final Context context;

    HumanHoloVoiceInteractionSession(Context context) {
        super(context);
        this.context = context;
    }

    @Override
    public View onCreateContentView() {
        LinearLayout panel = new LinearLayout(context);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        panel.setPadding(48, 48, 48, 48);
        panel.setBackgroundColor(Color.rgb(12, 20, 58));

        TextView label = new TextView(context);
        label.setText("Human Holo ist bereit");
        label.setTextColor(Color.WHITE);
        label.setTextSize(20f);
        label.setGravity(Gravity.CENTER);
        panel.addView(
            label,
            new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        );

        Button openButton = new Button(context);
        openButton.setText("Human Holo öffnen");
        openButton.setOnClickListener(ignored -> openHumanHolo());
        LinearLayout.LayoutParams buttonLayout = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        buttonLayout.topMargin = 28;
        panel.addView(openButton, buttonLayout);
        return panel;
    }

    @Override
    public void onShow(Bundle args, int showFlags) {
        super.onShow(args, showFlags);
    }

    private void openHumanHolo() {
        Intent intent = new Intent(context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        context.startActivity(intent);
        finish();
    }
}
