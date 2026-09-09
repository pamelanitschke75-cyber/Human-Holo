package com.solholo.app;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SolAudioRoute")
public class SolAudioRoutePlugin extends Plugin {
    private AudioManager audioManager;
    private boolean routeCaptured;
    private int previousMode = AudioManager.MODE_NORMAL;
    private boolean previousSpeakerphoneOn;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(
            Context.AUDIO_SERVICE
        );
    }

    private void runOnMainThread(Runnable action) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            action.run();
        } else {
            new Handler(Looper.getMainLooper()).post(action);
        }
    }

    @PluginMethod
    public void usePreferredOutput(PluginCall call) {
        runOnMainThread(() -> {
            if (audioManager == null) {
                call.reject("Die Android-Audioausgabe ist nicht verfügbar.");
                return;
            }

            if (!routeCaptured) {
                previousMode = audioManager.getMode();
                previousSpeakerphoneOn = audioManager.isSpeakerphoneOn();
                routeCaptured = true;
            }

            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            boolean externalSelected = false;
            boolean speakerSelected = false;
            int selectedDeviceType = AudioDeviceInfo.TYPE_UNKNOWN;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AudioDeviceInfo preferredExternal =
                    selectPreferredExternalCommunicationDevice();

                if (preferredExternal != null) {
                    externalSelected = true;
                    selectedDeviceType = preferredExternal.getType();
                    audioManager.setSpeakerphoneOn(false);
                }

                for (
                    AudioDeviceInfo device
                        : audioManager.getAvailableCommunicationDevices()
                ) {
                    if (
                        !externalSelected
                            && device.getType()
                                == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
                    ) {
                        speakerSelected = audioManager.setCommunicationDevice(device);
                        if (speakerSelected) {
                            selectedDeviceType = device.getType();
                        }
                        break;
                    }
                }
            } else {
                externalSelected = hasConnectedExternalOutput();
            }

            if (!externalSelected && !speakerSelected) {
                audioManager.setSpeakerphoneOn(true);
                speakerSelected = audioManager.isSpeakerphoneOn();
                if (speakerSelected) {
                    selectedDeviceType = AudioDeviceInfo.TYPE_BUILTIN_SPEAKER;
                }
            } else if (externalSelected) {
                audioManager.setSpeakerphoneOn(false);
            }

            JSObject result = new JSObject();
            result.put("externalSelected", externalSelected);
            result.put("speakerSelected", speakerSelected);
            result.put("selectedDeviceType", selectedDeviceType);
            call.resolve(result);
        });
    }

    private AudioDeviceInfo selectPreferredExternalCommunicationDevice() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return null;
        }

        AudioDeviceInfo currentDevice = audioManager.getCommunicationDevice();
        if (
            isExternalOutput(currentDevice)
                && audioManager.setCommunicationDevice(currentDevice)
        ) {
            return currentDevice;
        }

        for (
            AudioDeviceInfo device
                : audioManager.getAvailableCommunicationDevices()
        ) {
            if (
                isExternalOutput(device)
                    && audioManager.setCommunicationDevice(device)
            ) {
                return device;
            }
        }

        return null;
    }

    private boolean hasConnectedExternalOutput() {
        for (
            AudioDeviceInfo device
                : audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
        ) {
            if (isExternalOutput(device)) {
                return true;
            }
        }

        return false;
    }

    private boolean isExternalOutput(AudioDeviceInfo device) {
        if (device == null) {
            return false;
        }

        switch (device.getType()) {
            case AudioDeviceInfo.TYPE_BLUETOOTH_SCO:
            case AudioDeviceInfo.TYPE_BLUETOOTH_A2DP:
            case AudioDeviceInfo.TYPE_WIRED_HEADSET:
            case AudioDeviceInfo.TYPE_WIRED_HEADPHONES:
            case AudioDeviceInfo.TYPE_USB_HEADSET:
            case AudioDeviceInfo.TYPE_HEARING_AID:
                return true;
            default:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    return device.getType() == AudioDeviceInfo.TYPE_BLE_HEADSET
                        || device.getType() == AudioDeviceInfo.TYPE_BLE_SPEAKER;
                }
                return false;
        }
    }

    @PluginMethod
    public void restore(PluginCall call) {
        runOnMainThread(() -> {
            restorePreviousRoute();
            call.resolve();
        });
    }

    private void restorePreviousRoute() {
        if (audioManager == null || !routeCaptured) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.clearCommunicationDevice();
        }
        audioManager.setSpeakerphoneOn(previousSpeakerphoneOn);
        audioManager.setMode(previousMode);
        routeCaptured = false;
    }

    @Override
    protected void handleOnDestroy() {
        restorePreviousRoute();
        super.handleOnDestroy();
    }
}
