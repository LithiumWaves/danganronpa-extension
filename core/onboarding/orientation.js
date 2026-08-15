import { MONOKUMA_LESSON_STEPS, MONOKUMA_LESSON_TITLE } from "../monokumaLessonScript.js";
import { highlightElement, clearHighlight } from "./coachMarks.js";

const LESSON_BULLET_TITLE = "Important Thing!";

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWaitFor(step) {
    const raw = step?.waitFor;
    if (!raw || raw === "tap") return { type: "tap" };
    if (raw === "acknowledge") return { type: "acknowledge" };
    if (typeof raw === "object" && raw.type) return raw;
    return { type: "tap" };
}

function findLessonTruthItem() {
    return Array.from(document.querySelectorAll(".truth-item"))
        .find((el) => (el.textContent || "").toLowerCase().includes("important thing"));
}

export function createOrientationController({
    extensionFolderPath,
    openMonopadConfirmDialog,
    setActiveMonopadTab,
    setMapToHopesPeakFloorOneForLesson,
    handleTruthBullet,
    awardMonocoins,
    monocoinRewards,
    extensionSettings,
    extensionName,
    saveSettingsDebounced,
    fadeOutAudio,
    onboardingState,
    playSfx,
    getSfx,
} = {}) {
    let state = null;
    let stopHighlight = () => {};

    function isActive() {
        return !!state?.active && !state?.ended;
    }

    function removeSpriteMotion(overlayEl) {
        overlayEl?.classList.remove("sprite-hidden", "sprite-throw", "sprite-shake", "sprite-bounce");
    }

    function setInteractive(overlayEl, on) {
        overlayEl?.classList.toggle("interactive", !!on);
    }

    function setHint(stateRef, waitFor) {
        const hintEl = stateRef?.hintEl;
        if (!hintEl) return;
        if (waitFor.type === "click") {
            hintEl.textContent = "CLICK THE HIGHLIGHTED CONTROL";
        } else if (waitFor.type === "acknowledge") {
            hintEl.textContent = "";
        } else {
            hintEl.textContent = "TAP ANYWHERE TO CONTINUE";
        }
    }

    function setAcknowledgeVisible(stateRef, on) {
        if (!stateRef?.ackBtn) return;
        stateRef.ackBtn.hidden = !on;
    }

    function applyHighlight(selector) {
        stopHighlight();
        stopHighlight = () => {};
        if (!selector) {
            clearHighlight();
            return;
        }
        stopHighlight = highlightElement(selector, { dim: false }) || (() => {});
    }

    function cleanupLessonBullet() {
        const removeButton = document.querySelector(".truth-remove-button");
        removeButton?.click();
        document.querySelector(".truth-discard-confirm")?.click();
    }

    async function runStep(step, stateRef) {
        if (!step || !stateRef?.overlayEl) return;
        const overlayEl = stateRef.overlayEl;

        removeSpriteMotion(overlayEl);

        if (step.board) {
            overlayEl.classList.add("board");
            stateRef.titleEl.textContent = step.chalkTitle || MONOKUMA_LESSON_TITLE;
        } else {
            overlayEl.classList.remove("board");
            stateRef.titleEl.textContent = "";
        }

        if (step.action === "dropAndSwitchToTruth" || step.action === "dropAndSwitchToSocial" || step.action === "dropAndSwitchToSkills") {
            overlayEl.classList.add("sprite-hidden");
            await wait(260);
            if (step.tab) setActiveMonopadTab?.(step.tab);
            await wait(130);
            removeSpriteMotion(overlayEl);
            await wait(110);
        } else if (step.action === "throwAndSwitchToMap") {
            overlayEl.classList.add("sprite-throw");
            await wait(330);
            removeSpriteMotion(overlayEl);
            if (step.tab) setActiveMonopadTab?.(step.tab);
            stateRef.spriteEl.style.opacity = "0";
            await wait(120);
            stateRef.spriteEl.style.opacity = "1";
        } else if (step.tab) {
            setActiveMonopadTab?.(step.tab);
        }

        if (step.sprite) {
            stateRef.spriteEl.src = `${extensionFolderPath}/assets/monokuma/${step.sprite}`;
        }

        stateRef.spriteEl.style.opacity = String(
            Number.isFinite(Number(step.spriteOpacity))
                ? Math.max(0, Math.min(1, Number(step.spriteOpacity)))
                : 1,
        );

        if (step.action === "spawnTruthBullet") {
            handleTruthBullet?.(LESSON_BULLET_TITLE, "Will this show us whodunnit?", {
                grantMonocoins: false,
                grantXp: false,
                image: `${extensionFolderPath}/assets/images/ui/monokuma_kotodama.png`,
            });
            window.renderTruthBullets?.();
        }

        if (step.action === "autoReadAndDeleteTruthBullet") {
            findLessonTruthItem()?.click();
            stateRef.pendingTruthBulletCleanup = true;
        }

        if (step.action === "switchMapToHopesPeakFloor1") {
            setMapToHopesPeakFloorOneForLesson?.();
        }

        if (step.action === "boardReturnBounce") {
            overlayEl.classList.remove("sprite-hidden");
            overlayEl.classList.add("sprite-bounce");
            await wait(680);
            overlayEl.classList.remove("sprite-bounce");
        }

        stateRef.textEl.textContent = step.text || "";
        applyHighlight(step.highlight);
    }

    function bindWaitFor(waitFor, stateRef) {
        return new Promise((resolve) => {
            if (stateRef.ended) {
                resolve("ended");
                return;
            }

            const overlayEl = stateRef.overlayEl;
            const interactive = waitFor.type === "click" || waitFor.type === "acknowledge";
            setInteractive(overlayEl, interactive);
            setHint(stateRef, waitFor);
            setAcknowledgeVisible(stateRef, waitFor.type === "acknowledge");

            const cleanup = [];
            const finish = (reason) => {
                cleanup.forEach((fn) => {
                    try { fn(); } catch {}
                });
                overlayEl.onclick = null;
                resolve(reason);
            };

            const onSkip = (event) => {
                event.preventDefault();
                event.stopPropagation();
                finish("skip");
            };
            stateRef.skipBtn?.addEventListener("click", onSkip);
            cleanup.push(() => stateRef.skipBtn?.removeEventListener("click", onSkip));

            if (waitFor.type === "acknowledge") {
                const onAck = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    finish("ack");
                };
                stateRef.ackBtn?.addEventListener("click", onAck);
                cleanup.push(() => stateRef.ackBtn?.removeEventListener("click", onAck));
                return;
            }

            if (waitFor.type === "click" && waitFor.selector) {
                const onTarget = (event) => {
                    const hit = event.target?.closest?.(waitFor.selector);
                    if (!hit) return;
                    finish("click");
                };
                document.addEventListener("click", onTarget, true);
                cleanup.push(() => document.removeEventListener("click", onTarget, true));
                return;
            }

            const onOverlay = (event) => {
                if (event.target?.closest?.("#monokuma-lesson-skip, #monokuma-lesson-ack")) return;
                finish("tap");
            };
            overlayEl.onclick = onOverlay;
        });
    }

    async function end({ completed = false, skipped = false } = {}) {
        const current = state;
        if (!current || current.ended) return;
        current.ended = true;
        current.active = false;

        if (current.pendingTruthBulletCleanup) {
            cleanupLessonBullet();
            current.pendingTruthBulletCleanup = false;
        }

        stopHighlight();
        stopHighlight = () => {};
        clearHighlight();

        current.overlayEl.classList.remove("active", "board", "sprite-hidden", "sprite-throw", "sprite-shake", "sprite-bounce", "interactive");
        current.overlayEl.setAttribute("aria-hidden", "true");
        current.overlayEl.onclick = null;
        setAcknowledgeVisible(current, false);

        setActiveMonopadTab?.("settings");

        if (completed && !skipped) {
            const settings = extensionSettings[extensionName] ||= {};
            if (!settings.monokumaLessonRewardClaimed) {
                awardMonocoins?.(Number(monocoinRewards?.tutorialCompletion || 0), "Mr. Monokuma's Lesson completion");
                settings.monokumaLessonRewardClaimed = true;
                saveSettingsDebounced?.();
            }
            onboardingState?.markCoachesSeen?.(["truth", "map", "skills", "social"]);
        }

        await fadeOutAudio?.(current.trackEl, 650);
        state = null;
    }

    async function start({ skipConfirm = false } = {}) {
        if (isActive()) return;

        if (!skipConfirm) {
            const confirmed = await openMonopadConfirmDialog?.({
                title: "START LESSON",
                message: "Start Mr. Monokuma's Lesson? This guided tutorial will take over the Monopad until it finishes.",
                confirmLabel: "START",
                cancelLabel: "CANCEL",
            });
            if (!confirmed) return;
        }

        const overlayEl = document.getElementById("monokuma-lesson-overlay");
        const titleEl = document.getElementById("monokuma-lesson-title");
        const textEl = document.getElementById("monokuma-lesson-text");
        const spriteEl = document.getElementById("monokuma-lesson-sprite");
        const trackEl = document.getElementById("monokuma_lesson_track");
        const hintEl = overlayEl?.querySelector(".monokuma-lesson-hint");
        const skipBtn = document.getElementById("monokuma-lesson-skip");
        const ackBtn = document.getElementById("monokuma-lesson-ack");

        if (!overlayEl || !titleEl || !textEl || !spriteEl || !trackEl) return;

        overlayEl.classList.add("active", "board");
        overlayEl.classList.remove("interactive");
        overlayEl.setAttribute("aria-hidden", "false");
        titleEl.textContent = MONOKUMA_LESSON_TITLE;

        trackEl.loop = true;
        trackEl.volume = 0.5;
        trackEl.currentTime = 0;
        trackEl.play().catch(() => {});

        state = {
            active: true,
            ended: false,
            index: 0,
            overlayEl,
            titleEl,
            textEl,
            spriteEl,
            trackEl,
            hintEl,
            skipBtn,
            ackBtn,
            pendingTruthBulletCleanup: false,
        };

        while (state && !state.ended && state.index < MONOKUMA_LESSON_STEPS.length) {
            if (state.pendingTruthBulletCleanup) {
                cleanupLessonBullet();
                state.pendingTruthBulletCleanup = false;
            }

            const step = MONOKUMA_LESSON_STEPS[state.index];
            state.index += 1;
            await runStep(step, state);
            if (!state || state.ended) break;
            const result = await bindWaitFor(normalizeWaitFor(step), state);
            if (result === "skip") {
                playSfx?.(getSfx?.()?.click);
                await end({ completed: false, skipped: true });
                return;
            }
        }

        if (state && !state.ended) {
            await end({ completed: true });
        }
    }

    return {
        start,
        end,
        isActive,
        MONOKUMA_LESSON_TITLE,
    };
}
