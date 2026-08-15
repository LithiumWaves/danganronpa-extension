const OVERLAY_ID = "dangan-coach-overlay";
const HIGHLIGHT_ID = "dangan-coach-highlight";

const TAB_COACHES = {
    truth: {
        target: ".truth-container",
        text: "Evidence lands here during investigation. You don't add it by hand — when something important turns up, it shows up as a Truth Bullet.",
    },
    map: {
        target: ".map-image-wrap",
        text: "This is the academy map. Shop pins open my MonoMono Machine. If a room looks wrong, add a pin and place it yourself.",
    },
    skills: {
        target: ".items-grid-panel",
        text: "Gifts and skills live here. Select one, press Use, and the next classmate who speaks receives it. Choose carefully. Or don't.",
    },
    social: {
        target: ".social-list",
        text: "Your classmates. Click a name for their report, click again for more. Spend time or gifts and trust might grow. Might.",
    },
    chapters: {
        target: ".chapters-shell",
        text: "Your chapter log. FETCH only reads chats you mark. New chats while I'm loaded get marked for you — open MARKED CHATS to pick older ones.",
    },
    trialPrep: {
        target: ".dangan-trial-menu",
        text: "Court prep. Check skills, skim your bullets, then gather participants. Minigames start from the trial UI — I'll explain each one the first time it appears.",
    },
};

function queryTarget(target) {
    if (!target) return null;
    if (typeof target === "string") return document.querySelector(target);
    if (target instanceof Element) return target;
    return null;
}

function ensureHighlightEl() {
    let el = document.getElementById(HIGHLIGHT_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = HIGHLIGHT_ID;
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    return el;
}

function placeHighlight(el, targetEl) {
    if (!el || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const pad = 6;
    el.style.top = `${Math.max(0, rect.top - pad)}px`;
    el.style.left = `${Math.max(0, rect.left - pad)}px`;
    el.style.width = `${Math.max(0, rect.width + pad * 2)}px`;
    el.style.height = `${Math.max(0, rect.height + pad * 2)}px`;
    el.classList.add("active");
}

export function highlightElement(target, { dim = true } = {}) {
    const targetEl = queryTarget(target);
    const el = ensureHighlightEl();
    if (!targetEl) {
        el.classList.remove("active", "dim");
        return () => {};
    }

    el.classList.toggle("dim", !!dim);
    const update = () => placeHighlight(el, targetEl);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
        el.classList.remove("active", "dim");
    };
}

export function clearHighlight() {
    const el = document.getElementById(HIGHLIGHT_ID);
    el?.classList.remove("active", "dim");
}

function removeCoachOverlay() {
    document.getElementById(OVERLAY_ID)?.remove();
}

export function hideCoachMark() {
    removeCoachOverlay();
    clearHighlight();
}

export function showCoachMark({
    target,
    text = "",
    title = "MR. MONOKUMA",
    acknowledgeLabel = "GOT IT",
} = {}) {
    hideCoachMark();

    return new Promise((resolve) => {
        const targetEl = queryTarget(target);
        const overlay = document.createElement("div");
        overlay.id = OVERLAY_ID;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "false");
        overlay.innerHTML = `
            <div class="dangan-coach-card">
                <div class="dangan-coach-nameplate">${title}</div>
                <div class="dangan-coach-text"></div>
                <div class="dangan-coach-actions">
                    <button type="button" class="dangan-coach-got-it">${acknowledgeLabel}</button>
                </div>
            </div>
        `;
        overlay.querySelector(".dangan-coach-text").textContent = text;
        document.body.appendChild(overlay);

        const stopHighlight = highlightElement(targetEl);
        const card = overlay.querySelector(".dangan-coach-card");

        const positionCard = () => {
            if (!card) return;
            const highlight = document.getElementById(HIGHLIGHT_ID);
            const hole = highlight?.classList.contains("active")
                ? highlight.getBoundingClientRect()
                : (targetEl?.getBoundingClientRect() || null);
            const cardRect = card.getBoundingClientRect();
            const margin = 16;
            let top = window.innerHeight - cardRect.height - 28;
            let left = Math.max(16, (window.innerWidth - cardRect.width) / 2);

            if (hole) {
                const below = hole.bottom + margin;
                const above = hole.top - cardRect.height - margin;
                if (below + cardRect.height < window.innerHeight - 12) {
                    top = below;
                } else if (above > 12) {
                    top = above;
                }
                left = Math.min(
                    Math.max(16, hole.left + hole.width / 2 - cardRect.width / 2),
                    window.innerWidth - cardRect.width - 16,
                );
            }

            card.style.top = `${Math.max(12, top)}px`;
            card.style.left = `${Math.max(12, left)}px`;
        };

        requestAnimationFrame(() => {
            overlay.classList.add("active");
            positionCard();
        });

        window.addEventListener("resize", positionCard);

        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            window.removeEventListener("resize", positionCard);
            stopHighlight();
            overlay.classList.remove("active");
            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 180);
        };

        overlay.querySelector(".dangan-coach-got-it")?.addEventListener("click", finish);
    });
}

export function createCoachController({ onboardingState, isOrientationActive = () => false }) {
    let showing = false;

    async function maybeShowCoach(id) {
        if (showing) return;
        if (!onboardingState?.areFeatureCoachesEnabled?.()) return;
        if (isOrientationActive()) return;
        if (!id || onboardingState.isCoachSeen(id)) return;

        const spec = TAB_COACHES[id];
        if (!spec) return;

        const target = queryTarget(spec.target);
        if (!target) {
            onboardingState.markCoachSeen(id);
            return;
        }

        showing = true;
        try {
            await showCoachMark({ target, text: spec.text });
            onboardingState.markCoachSeen(id);
        } finally {
            showing = false;
        }
    }

    function maybeShowTabCoach(tab) {
        if (!tab || tab === "settings" || tab === "welcome") return;
        void maybeShowCoach(tab);
    }

    return {
        maybeShowCoach,
        maybeShowTabCoach,
        hideCoachMark,
        TAB_COACHES,
    };
}
