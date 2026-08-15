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
        theme: "hangman",
        image: "assets/images/minigames/hangmans-gambit-tutorial.png",
        bodyHtml: `<p><strong>Hangman's Gambit</strong> is a minigame where you are tasked with answering a <strong>Question</strong>, visible in the bottom-right side of your screen. The answer to this question is in the form of an <strong>Anagram</strong>. During <strong>Hangman's Gambit</strong>, you will see colored spheres with letters printed on them. Clicking a sphere will load it into your <strong>Stock</strong>, at the bottom of your screen in the center. Matching two of the same letter will fire that combination into the <strong>Anagram</strong>. If the letter is correct, you'll expose a part of the Anagram! If it's wrong, however, you'll take damage to your <strong>Health</strong>. You can see your <strong>Health</strong> on the top-right, represented by hearts. Taking damage deducts <strong>Monocoins</strong>; run out of <strong>Health</strong> and it's game over! Underneath your Health you will see a green bar — by pressing either Shift key, you can activate <strong>Bullet Time</strong>, which will slow time by 50% for both the timer (Visible in the bottom left), and for the moving spheres. <strong>Bullet Time</strong> regenerates over time. Can you solve the Hangman's Gambit..?</p>`,
    },
    argumentArmament: {
        title: "Argument Armament",
        promptName: "Argument Armament",
        theme: "armament",
        yesLabel: "Yes, please!",
        noLabel: "No, let's go!",
        image: "assets/images/minigames/aa-tutorial.png",
        bodyHtml: `<p><strong>Argument Armament</strong> is a minigame where you are tasked with combating your opponent's <strong>Statements</strong>. <strong>Statements</strong> will fill the 3×3 grid at random, and zoom closer to the camera, making the grid cell glow red gradually. After a small amount of time glowing red, you will take damage to your <strong>Health</strong>. Running out of <strong>Health</strong>, visible in the bottom-right. Run out of health and it's game over! To combat a <strong>Statement</strong>, simply click the grid cell you wish to <strong>Shoot</strong>, or use the Arrow Keys and the Space bar to <strong>Shoot</strong>. <strong>Shooting</strong> consumes 1 <strong>Ammo</strong>; you can reload <strong>Ammo</strong> by pressing the R key, or clicking the <strong>Ammo</strong> icon, or by running out of <strong>Ammo</strong>. Shooting a <strong>White Statement</strong> prevents you from taking damage. Shooting a <strong>Yellow Statement</strong> prevents you from taking damage and deals damage to your opponent. Shooting a <strong>Blue Statement</strong> will deal damage to your opponent and turn the <strong>Blue Statement</strong> into a <strong>Yellow Statement</strong>. Shooting a <strong>Pink Statement</strong> will deal damage to yourself, so watch out! But don't worry! Letting a <strong>Pink Statement</strong> turn red won't deal damage to you! After enough damage is dealt, your opponent — and their <strong>Statements</strong> — will speed up. Damage your opponent enough and you'll enter the <strong>Final Question</strong>! During the <strong>Final Question</strong>, you'll need to make a <strong>Final Answer</strong> that answers the opponent's <strong>Final Question</strong> by using the Arrow Keys; there are four options, so think quickly and with confidence! Getting the <strong>Final Answer</strong> wrong or running out of time will give the opponent some <strong>Health</strong> back, and deal some damage to you, so try not to mess up! It's all or nothing now..!</p>`,
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

// Minigame loading overlays use the max 32-bit z-index (2147483647) and keep
// pointer-events while they fade out. The prompt has to sit at that same
// ceiling *and* yank the loader out of the DOM, or the Yes/No bar is invisible
// and unclickable underneath it (NSD/MPD even await the prompt *before* hide()).
const GUIDE_Z = "2147483647";
const LOADING_OVERLAY_ID = "hg-loading-state";

function dismissMinigameLoadingOverlay() {
    const el = document.getElementById(LOADING_OVERLAY_ID);
    if (!el) return;
    try { el.hide?.(); } catch {}
    el.style.pointerEvents = "none";
    el.remove();
}

function liftGuideLayer(el) {
    if (!el) return;
    el.style.setProperty("z-index", GUIDE_Z, "important");
    el.style.setProperty("pointer-events", "auto", "important");
}

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#${PROMPT_ID} {
    position: fixed; bottom: 0; left: 0; right: 0;
    z-index: ${GUIDE_Z};
    pointer-events: auto;
    cursor: auto;
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
    z-index: ${GUIDE_Z};
    pointer-events: auto;
    cursor: auto;
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
.dgn-mg-modal-inner.has-art {
    width: min(700px, 94vw);
    max-height: 90vh;
}
.dgn-mg-modal-header {
    padding: 14px 18px 10px;
    border-bottom: 1px solid rgba(120, 180, 255, 0.22);
    font-family: "Orbitron", "Rajdhani", sans-serif;
    letter-spacing: 0.12em;
    color: #e8f6ff;
    font-size: 14px;
}
.dgn-mg-modal-title {
    font-family: "Orbitron", "Impact", monospace;
    font-size: clamp(16px, 3vw, 22px);
    font-weight: 900;
    letter-spacing: 0.06em;
}
.dgn-mg-modal-img {
    width: 100%; display: block; height: auto; flex-shrink: 0;
    border-bottom: 1px solid rgba(120, 180, 255, 0.16);
}
.dgn-mg-modal-body {
    padding: 16px 20px 8px;
    overflow-y: auto;
    color: rgba(214, 226, 244, 0.92);
    font-family: "Rajdhani", sans-serif;
    font-size: clamp(13px, 1.7vw, 16px);
    line-height: 1.45;
    flex: 1;
}
.dgn-mg-modal-inner.has-art .dgn-mg-modal-body {
    padding: 20px 24px;
    font-family: "Noto Sans JP", "Noto Sans", sans-serif;
    font-size: clamp(12px, 1.8vw, 14px);
    line-height: 1.75;
}
.dgn-mg-modal-body p { margin: 0; }
.dgn-mg-modal-body ul { margin: 0; padding-left: 1.15em; }
.dgn-mg-modal-body li { margin: 0 0 8px; }
.dgn-mg-modal-body strong { color: #9be7ff; }

#${PROMPT_ID}.theme-hangman {
    border-top-color: rgba(0, 220, 100, 0.5);
    box-shadow: 0 -12px 40px rgba(0, 220, 100, 0.25);
}
#${PROMPT_ID}.theme-hangman .dgn-mg-prompt-text { color: rgba(210, 235, 210, 0.92); }
#${PROMPT_ID}.theme-hangman .dgn-mg-prompt-text strong { color: #44ff88; }
#${PROMPT_ID}.theme-hangman .dgn-mg-prompt-btn {
    border-color: rgba(0, 200, 80, 0.6);
    background: rgba(0, 30, 12, 0.85);
    color: #44ff88;
}
#${PROMPT_ID}.theme-hangman .dgn-mg-prompt-btn:hover {
    background: rgba(0, 60, 24, 0.95);
    box-shadow: 0 0 12px rgba(0, 255, 100, 0.4);
}
#${MODAL_ID}.theme-hangman .dgn-mg-modal-inner {
    background: rgba(4, 12, 32, 0.98);
    border-color: rgba(0, 200, 80, 0.45);
    box-shadow: 0 0 40px rgba(0, 180, 70, 0.2);
}
#${MODAL_ID}.theme-hangman .dgn-mg-modal-header { border-bottom-color: rgba(0, 180, 70, 0.25); }
#${MODAL_ID}.theme-hangman .dgn-mg-modal-title {
    color: #44ff88;
    text-shadow: 0 0 14px rgba(0, 255, 100, 0.6);
}
#${MODAL_ID}.theme-hangman .dgn-mg-modal-body { color: rgba(200, 220, 205, 0.88); }
#${MODAL_ID}.theme-hangman .dgn-mg-modal-body strong { color: #66ffaa; }
#${MODAL_ID}.theme-hangman .dgn-mg-modal-close {
    border-color: rgba(0, 200, 80, 0.6);
    background: rgba(0, 30, 12, 0.85);
    color: #44ff88;
}

#${PROMPT_ID}.theme-armament {
    border-top-color: rgba(200, 80, 255, 0.5);
    box-shadow: 0 -12px 40px rgba(160, 50, 255, 0.25);
}
#${PROMPT_ID}.theme-armament .dgn-mg-prompt-text { color: rgba(220, 200, 235, 0.92); }
#${PROMPT_ID}.theme-armament .dgn-mg-prompt-text strong { color: rgba(220, 160, 255, 0.95); }
#${PROMPT_ID}.theme-armament .dgn-mg-prompt-btn {
    border-color: rgba(200, 80, 255, 0.55);
    background: rgba(40, 0, 70, 0.85);
    color: rgba(220, 190, 255, 0.95);
}
#${PROMPT_ID}.theme-armament .dgn-mg-prompt-btn:hover {
    background: rgba(120, 30, 200, 0.6);
    box-shadow: 0 0 12px rgba(180, 60, 255, 0.4);
}
#${MODAL_ID}.theme-armament .dgn-mg-modal-inner {
    background: rgba(8, 0, 24, 0.98);
    border-color: rgba(180, 60, 255, 0.45);
    box-shadow: 0 0 40px rgba(150, 40, 220, 0.2);
}
#${MODAL_ID}.theme-armament .dgn-mg-modal-header { border-bottom-color: rgba(180, 60, 255, 0.25); }
#${MODAL_ID}.theme-armament .dgn-mg-modal-title {
    color: rgba(220, 160, 255, 0.95);
    text-shadow: 0 0 14px rgba(180, 80, 255, 0.6);
}
#${MODAL_ID}.theme-armament .dgn-mg-modal-body { color: rgba(220, 200, 240, 0.88); }
#${MODAL_ID}.theme-armament .dgn-mg-modal-body strong { color: rgba(220, 160, 255, 0.95); }
#${MODAL_ID}.theme-armament .dgn-mg-modal-close {
    border-color: rgba(180, 60, 255, 0.6);
    background: rgba(24, 0, 48, 0.85);
    color: rgba(220, 160, 255, 0.95);
}
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
                <button type="button" class="dgn-mg-prompt-btn yes">${guide.yesLabel || "Let's hear it"}</button>
                <button type="button" class="dgn-mg-prompt-btn no">${guide.noLabel || "No, just start"}</button>
                <button type="button" class="dgn-mg-prompt-btn never">No, and don't remind me</button>
            </div>
        `;
        if (guide.theme) el.classList.add(`theme-${guide.theme}`);
        document.body.appendChild(el);
        liftGuideLayer(el);
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
        const body = guide.bodyHtml || `<ul>${items}</ul>`;
        const innerClass = guide.image || guide.bodyHtml ? "dgn-mg-modal-inner has-art" : "dgn-mg-modal-inner";
        modal.innerHTML = `
            <div class="${innerClass}">
                <div class="dgn-mg-modal-header"><div class="dgn-mg-modal-title">${guide.title}</div></div>
                ${img}
                <div class="dgn-mg-modal-body">${body}</div>
                <div class="dgn-mg-modal-footer">
                    <button type="button" class="dgn-mg-modal-close">OK, let's go!</button>
                </div>
            </div>
        `;
        if (guide.theme) modal.classList.add(`theme-${guide.theme}`);
        document.body.appendChild(modal);
        liftGuideLayer(modal);
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
    dismissMinigameLoadingOverlay();
    const wants = await showPrompt(guide);
    if (wants) await showModal(guide);
    return wants;
}

export function destroyMinigameGuideUi() {
    document.getElementById(PROMPT_ID)?.remove();
    document.getElementById(MODAL_ID)?.remove();
}
