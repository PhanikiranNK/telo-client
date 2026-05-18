// client/src/hooks/useFeedback.ts
import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export const useFeedback = () => {
    const sentSound = useRef<Audio.Sound | null>(null);
    const receivedSound = useRef<Audio.Sound | null>(null);
    const errorSound = useRef<Audio.Sound | null>(null);

    // Pre-load sounds into memory immediately when the workspace boots up
    useEffect(() => {
        async function loadAssets() {
            try {
                // Ensure audio plays correctly on iOS silent mode as well
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
                });

                const { sound: send } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/sent.mp3')
                );
                sentSound.current = send;

                const { sound: receive } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/received.mp3')
                );
                receivedSound.current = receive;

                const { sound: err } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/error.mp3')
                );
                errorSound.current = err;
            } catch (error) {
                console.warn('⚠️ Audio assets failed to cache:', error);
            }
        }

        loadAssets();

        // Clean up memory buffers when hook unmounts to prevent memory leaks
        return () => {
            sentSound.current?.unloadAsync();
            receivedSound.current?.unloadAsync();
            errorSound.current?.unloadAsync();
        };
    }, []);

    // 1. Success Trigger: Light crisp snap + snappy pop audio
    const triggerMessageSent = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (sentSound.current) {
                await sentSound.current.replayAsync();
            }
        } catch (e) {
            console.warn('Feedback Error (Sent):', e);
        }
    };

    // 2. Inbound Trigger: Solid alert bump + chime sound
    const triggerMessageReceived = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (receivedSound.current) {
                await receivedSound.current.replayAsync();
            }
        } catch (e) {
            console.warn('Feedback Error (Received):', e);
        }
    };

    // 3. Error Trigger: Aggressive warning rumble + low alert tone
    const triggerErrorNotification = async () => {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (errorSound.current) {
                await errorSound.current.replayAsync();
            }
        } catch (e) {
            console.warn('Feedback Error (Warning):', e);
        }
    };

    return {
        triggerMessageSent,
        triggerMessageReceived,
        triggerErrorNotification,
    };
};