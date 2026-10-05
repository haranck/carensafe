// Runs `task` once the browser is idle (or after a short delay where requestIdleCallback is missing).
// Returns a cancel function, e.g. for an effect cleanup.
export const runWhenIdle = (task, timeout = 3000) => {
    if ("requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(task, { timeout });
        return () => window.cancelIdleCallback(idleId);
    }
    const timer = setTimeout(task, 1500);
    return () => clearTimeout(timer);
};
