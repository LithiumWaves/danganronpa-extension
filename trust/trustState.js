export function clampTrust(value) {
    if (value > 10) return 10;
    if (value < -10) return -10;
    return value;
}

export function nextTrustUp(current) {
    if (current < 0) {
        const next = current + 1;
        return next === 0 ? 1 : next;
    }
    return current + 1;
}

export function nextTrustDown(current) {
    if (current > 0) {
        const next = current - 1;
        return next === 0 ? -1 : next;
    }
    return current - 1;
}
