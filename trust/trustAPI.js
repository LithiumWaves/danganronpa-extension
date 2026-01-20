import {
    nextTrustUp,
    nextTrustDown,
    clampTrust
} from "./trustState.js";

import {
    playTrustRankUp,
    playTrustRankDown,
    playTrustMaxed,
    playTrustToDistrustTransition,
    playDistrustRankDown,
    playDistrustRankUp,
    playDistrustToTrustRecovery
} from "./trustAnimations.js";

export function increaseTrust(char) {
    if (!char) return;

    const previous = char.trustLevel ?? 1;
    if (previous >= 10) return;

    char.trustLevel = clampTrust(
        nextTrustUp(previous)
    );

    // 🎬 Animation routing
    if (previous === -1 && char.trustLevel === 1) {
        playDistrustToTrustRecovery();
    } else if (previous === 9 && char.trustLevel === 10) {
        playTrustMaxed();
    } else if (previous < 0) {
        playDistrustRankUp(previous, char.trustLevel);
    } else {
        playTrustRankUp(previous, char.trustLevel);
        
        if (window.refreshActiveCharacterUI) {
    window.refreshActiveCharacterUI();
}
        
    }
}

export function decreaseTrust(char) {
    if (!char) return;

    const previous = char.trustLevel ?? 1;
    if (previous <= -10) return;

    char.trustLevel = clampTrust(
        nextTrustDown(previous)
    );

    if (previous > 0 && char.trustLevel > 0) {
        playTrustRankDown(previous, char.trustLevel);
    } else if (previous === 1 && char.trustLevel === -1) {
        playTrustToDistrustTransition();
    } else {
        playDistrustRankDown(previous, char.trustLevel);

if (window.refreshActiveCharacterUI) {
    window.refreshActiveCharacterUI();
}
        
    }
}
