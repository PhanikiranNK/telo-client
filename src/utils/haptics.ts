// client/src/utils/haptics.ts
import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

// Ensure your sound asset path is correct relative to this file
const HAPTIC_SOUND_SOURCE = require('../../assets/sounds/click.mp3');

let soundPlayer: any = null;

export const triggerMessageFeedback = async () => {
    try {
        // 1. Fire the native haptic engine feedback loop instantly
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // 2. Stream/Play the click audio asset using the correct modern player structure
        if (!soundPlayer) {
            soundPlayer = createAudioPlayer(HAPTIC_SOUND_SOURCE);
        }

        soundPlayer.play();
    } catch (error) {
        console.warn('⚠️ Haptic/Audio player handled fallback:', error);
    }
};