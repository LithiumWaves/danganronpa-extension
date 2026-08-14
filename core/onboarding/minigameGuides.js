import { extensionFolderPath } from "../constants.js";

const STYLE_ID = "dangan-minigame-guide-style";
const PROMPT_ID = "dangan-minigame-guide-prompt";
const MODAL_ID = "dangan-minigame-guide-modal";

let _isEnabled = () => true;
let _disable = () => {};

export const MINIGAME_GUIDES = {
    hangmansGambit: {
        title: "Hangman's Gambit",
        promptName: "Hangman's Gambit",
        image: "assets/images/minigames/hangmans-gambit-tutorial.png",
        bullets: [
            "Goal: spell the anagram that answers the question in the corner.",
            "Click matching letter spheres to load them into Stock; a correct pair reveals a letter.",
            "Wrong letters cost Health (and Monocoins). Empty Health is game over.",
            "Hold Shift for Bullet Time — it slows the spheres and the timer, then regenerates.",
        ],
    },
    argumentArmament: {
        title: "Argument Armament",
        promptName: "Argument Armament",
        image: "assets/images/minigames/aa-tutorial.png",
        bullets: [
            "Goal: shoot statements on the 3×3 grid before they flash red and damage you.",
            "Click a cell or use Arrow Keys + Space to shoot. R (or the ammo icon) reloads.",
            "White/Yellow/Blue shots help you. Pink shots hurt you — but a pink that turns red does not.",
            "Deal enough damage to reach the Final Question; pick the right answer with the Arrow Keys.",
        ],
    },
    nonStopDebate: {
        title: "Non-Stop Debate",
        promptName: "a Non-Stop Debate",
        bullets: [
            "Goal: shoot a Truth Bullet at an orange weak spot in a statement.",
            "Aim with the mouse. Click to fire. Arrow Up/Down cycles bullets.",
            "Space fires White Noise. Right Shift absorbs a phrase. Enter holds a Lie shot.",
            "A clean hit preformats your next reply. Misses and bad shots cost you.",
        ],
    },
    massPanicDebate: {
        title: "Mass Panic Debate",
        promptName: "a Mass Panic Debate",
        bullets: [
            "Goal: three people talking at once — hit the orange weak spot in the key column.",
            "Same shooting rules as Non-Stop Debate: click to fire, arrows to cycle bullets.",
            "Space still fires White Noise. Watch the glowing column; that's the one that matters.",
            "A hit preformats your next reply, same as a normal debate.",
        ],
    },
    scrumDebate: {
        title: "Scrum Debate",
        promptName: "a Scrum Debate",
        bullets: [
            "Goal: pick the Truth Bullet that answers the opposing team's claim each round.",
            "Select a bullet, then fire with Click, Enter, or Space.",
            "Wrong shots cost Health. Run out and your side loses the scrum.",
            "Win the last round and the group aligns with your theory.",
        ],
    },
    rebuttalShowdown: {
        title: "Rebuttal Showdown",
        promptName: "a Rebuttal Showdown",
        bullets: [
            "Goal: cut the matching weak point with the right Truth Blade.",
            "Select a blade, then right-click the weak point to cut.",
            "Wrong blades and misses pile up. Too many misses and you lose the clash.",
            "Land enough cuts and you counter — that preformats your next reply.",
        ],
    },
    questionTruth: {
        title: "Question Truth",
        promptName: "Question Truth",
        bullets: [
            "Goal: pick the Truth Bullet that answers the prompt.",
            "Click a bullet on the left, then confirm it. HINT peeks if you're stuck.",
            "Wrong picks cost Health. A correct pick awards Monocoins and a GOT IT.",
            "Use it when the trial needs a new branch of discussion.",
        ],
    },
    questionTime: {
        title: "Question Time",
        promptName: "Question Time",
        bullets: [
            "Goal: pick the correct answer before time runs out.",
            "Click an option, or press 1–4.",
            "Wrong answers cost Health. A correct pick awards XP and a GOT IT.",
            "Four choices. One right. Don't overthink it… unless you should.",
        ],
    },
    mindMine: {
        title: "Mind Mine",
        promptName: "Mind Mine",
        bullets: [
            "Goal: break blocks to uncover hidden sentences, then click a revealed sentence.",
            "Click a group of the same color to clear it. Neighbors change color.",
            "Clicking a totally isolated block costs time. Don't.",
            "Click a fully revealed sentence to GOT IT and lock in that theory.",
        ],
    },
    voting: {
        title: "Voting Time",
        promptName: "Voting Time",
        bullets: [
            "Goal: vote for the blackened before the timer hits zero.",
            "Click a portrait to select them, then confirm your vote.",
            "Everyone else votes too. The plurality pick is submitted.",
            "Right call: hope. Wrong call: well. You know how this goes.",
        ],
    },
};

export function configureMinigameGuides({ isTutorialPromptEnabled, disableTutorialPrompt } = {}) {
    if (typeof isTutorialPromptEnabled === "function") _isEnabled = isTutorialPromptEnabled;
    if (typeof disableTutorialPrompt === "function") _disable = disableTutorialPrompt;
}

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#${PROMPT_ID} {
    position: fixed; bottom: 0; left: 0; right: 0;
    z-index: 2147483646;
    background: rgba(6, 10, 18, 0.97);
    border-top: 2px solid rgba(120, 200, 255, 0.45);
    box-shadow: 0 -12px 40px rgba(40, 90, 160, 0.28);
    padding: 20px 32px 24px;
    font-family: "Rajdhani", "Noto Sans JP", sans-serif;
    text-align: center;
    opacity: 0; transform: translateY(12px);
    transition: opacity 280ms ease, transform 280ms ease;
}
#${PROMPT_ID}.is-on { opacity: 1; transform: translateY(0); }
.dgn-mg-prompt-text {
    color: rgba(220, 232, 255, 0.94);
    font-size: clamp(13px, 2vw, 17px);
    line-height: 1.6;
    margin-bottom: 18px;
}
.dgn-mg-prompt-text strong { color: #9be7ff; }
.dgn-mg-prompt-buttons { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
.dgn-mg-prompt-btn {
    padding: 9px 22px;
    border-radius: 4px;
    border: 1.5px solid rgba(120, 200, 255, 0.55);
    background: rgba(8, 18, 32, 0.9);
    color: #e8f4ff;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
}
.dgn-mg-prompt-btn:hover { background: rgba(18, 40, 70, 0.95); box-shadow: 0 0 12px rgba(80, 180, 255, 0.35); }
.dgn-mg-prompt-btn.never { border-color: rgba(180, 180, 190, 0.4); color: rgba(200, 210, 220, 0.8); }

#${MODAL_ID} {
    position: fixed; inset: 0;
    z-index: 2147483646;
    background: rgba(2, 4, 10, 0.72);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 220ms ease;
    padding: 24px;
}
#${MODAL_ID}.is-on { opacity: 1; }
.dgn-mg-modal-inner {
    width: min(640px, 94vw);
    max-height: min(86vh, 760px);
    overflow: hidden;
    display: flex; flex-direction: column;
    background: linear-gradient(180deg, rgba(8, 14, 24, 0.98), rgba(4, 8, 14, 0.98));
    border: 1px solid rgba(140, 200, 255, 0.4);
    border-radius: 10px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
}
.dgn-mg-modal-header {
    padding: 14px 18px 10px;
    border-bottom: 1px solid rgba(120, 180, 255, 0.22);
    font-family: "Orbitron", "Rajdhani", sans-serif;
    letter-spacing: 0.12em;
    color: #e8f6ff;
    font-size: 14px;
}
.dgn-mg-modal-img {
    width: 100%; display: block; max-height: 220px; object-fit: cover;
    border-bottom: 1px solid rgba(120, 180, 255, 0.16);
}
.dgn-mg-modal-body {
    padding: 16px 20px 8px;
    overflow-y: auto;
    color: rgba(214, 226, 244, 0.92);
    font-family: "Rajdhani", sans-serif;
    font-size: clamp(13px, 1.7vw, 16px);
    line-height: 1.45;
}
.dgn-mg-modal-body ul { margin: 0; padding-left: 1.15em; }
.dgn-mg-modal-body li { margin: 0 0 8px; }
.dgn-mg-modal-footer {
    padding: 12px 18px 16px;
    display: flex; justify-content: flex-end;
    border-top: 1px solid rgba(120, 180, 255, 0.16);
}
.dgn-mg-modal-close {
    padding: 8px 22px;
    border-radius: 4px;
    border: 1.5px solid rgba(120, 200, 255, 0.6);
    background: rgba(8, 22, 40, 0.95);
    color: #9be7ff;
    font-family: "Rajdhani", sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
}
.dgn-mg-modal-close:hover { box-shadow: 0 0 12px rgba(80, 180, 255, 0.4); }
    `;
    document.head.appendChild(style);
}

function dismissEl(el, className = "is-on") {
    return new Promise((resolve) => {
        if (!el) {
            resolve();
            return;
        }
        el.classList.remove(className);
        setTimeout(() => {
            el.remove();
            resolve();
        }, 280);
    });
}

function showPrompt(guide) {
    if (!_isEnabled()) return Promise.resolve(false);
    ensureStyles();
    document.getElementById(PROMPT_ID)?.remove();

    return new Promise((resolve) => {
        const el = document.createElement("div");
        el.id = PROMPT_ID;
        el.innerHTML = `
            <div class="dgn-mg-prompt-text">
                The minigame <strong>${guide.promptName || guide.title}</strong> is about to begin. Would you like to hear an explanation?
            </div>
            <div class="dgn-mg-prompt-buttons">
                <button type="button" class="dgn-mg-prompt-btn yes">Let's hear it</button>
                <button type="button" class="dgn-mg-prompt-btn no">No, just start</button>
                <button type="button" class="dgn-mg-prompt-btn never">No, and don't remind me</button>
            </div>
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-on")));

        const finish = async (answer) => {
            await dismissEl(el);
            resolve(answer);
        };

        el.querySelector(".yes")?.addEventListener("click", () => finish(true));
        el.querySelector(".no")?.addEventListener("click", () => finish(false));
        el.querySelector(".never")?.addEventListener("click", () => {
            try { _disable(); } catch {}
            finish(false);
        });
    });
}

function showModal(guide) {
    ensureStyles();
    document.getElementById(MODAL_ID)?.remove();

    return new Promise((resolve) => {
        const modal = document.createElement("div");
        modal.id = MODAL_ID;
        const img = guide.image
            ? `<img class="dgn-mg-modal-img" src="${extensionFolderPath}/${guide.image}" alt=""/>`
            : "";
        const items = (guide.bullets || []).map((line) => `<li>${line}</li>`).join("");
        modal.innerHTML = `
            <div class="dgn-mg-modal-inner">
                <div class="dgn-mg-modal-header">${guide.title}</div>
                ${img}
                <div class="dgn-mg-modal-body"><ul>${items}</ul></div>
                <div class="dgn-mg-modal-footer">
                    <button type="button" class="dgn-mg-modal-close">OK, let's go!</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add("is-on")));

        modal.querySelector(".dgn-mg-modal-close")?.addEventListener("click", async () => {
            await dismissEl(modal);
            resolve();
        });
    });
}

export async function promptMinigameTutorial(guideId) {
    const guide = MINIGAME_GUIDES[guideId];
    if (!guide) return false;
    const wants = await showPrompt(guide);
    if (wants) await showModal(guide);
    return wants;
}

export function destroyMinigameGuideUi() {
    document.getElementById(PROMPT_ID)?.remove();
    document.getElementById(MODAL_ID)?.remove();
}
