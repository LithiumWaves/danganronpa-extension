import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    fullscreen: false
};

let activeSocialCharacterId = null;

const truthBullets = [];

const truthBulletQueue = [];
let truthBulletAnimating = false;

/* =========================
   TRUTH BULLET FUNCTIONS
   ========================= */

const processedTruthSignatures = new Set();
const processedSocialSignatures = new Set();

const SOCIAL_REGEX = /V3C\|\s*SOCIAL:\s*([^\n\r]+)/g;

const SOCIAL_DOWN_REGEX = /V3C\|\s*SOCIAL_DOWN:\s*([^\n\r]+)/g;

/* =========================
   SOCIAL / CHARACTER DATA
   ========================= */

const characters = new Map(); 
// key: normalized name → value: character object

async function generateIsolated(prompt) {
    if (!window.SillyTavern?.getContext) {
        throw new Error("SillyTavern context unavailable");
    }

    const ctx = SillyTavern.getContext();
    if (!ctx.generateRaw) {
        throw new Error("generateRaw not available");
    }

    const fullPrompt = `
You are an analysis engine.
You do NOT roleplay.
You do NOT write dialogue.
You ONLY output structured analytical reports.

${prompt}
`.trim();

    const result = await ctx.generateRaw({
        prompt: fullPrompt,
        max_tokens: 300,
        temperature: 0.25,
        top_p: 0.9,
        stop: ["USER:", "ASSISTANT:", "###"]
    });

    return (result || "").trim();
}


async function generateCharacterNotes(char) {
const profile = char.social?.profile;

const hasRealData =
    profile &&
    Object.values(profile).some(
        v => v && v !== "unknown"
    );

if (hasRealData && char.social?.notes) {
    return char.social.notes;
}

    const sourceText = getCharacterSourceText(char.name);

    const prompt = `
TASK:
Analyze the character and produce a concise analytical profile.

You are NOT summarizing.
You are NOT copying phrasing.
You are performing trait abstraction.

Rules:
- Do NOT roleplay
- Do NOT quote the source text
- Do NOT reuse wording from the character card
- Use neutral, third-person analytical language
- Combine similar traits into categories
- Remove redundancy

Return the data EXACTLY in this format:

ultimate: <profession or role>
height: <approximate or inferred>
measurements: <approximate or inferred>
personality: <3–5 concise analytical traits>
likes: <short list of interests or motivations>
dislikes: <short list of aversions or conflicts>

Use commas to separate items.
Use neutral psychological descriptors.
If unsure, infer conservatively.

SOURCE DATA:
${sourceText}
`.trim();

    try {
        const result = (await generateIsolated(prompt)) || "";
        const lines = result
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
        
const map = {};

lines.forEach(line => {
    const [key, ...rest] = line.split(":");
    if (!key || !rest.length) return;
    map[key.trim().toLowerCase()] = rest.join(":").trim();
});

char.social = {
    profile: {
        ultimate: map.ultimate || "unknown",
        height: map.height || "unknown",
        measurements: map.measurements || "unknown",
        personality: map.personality || "unknown",
        likes: map.likes || "unknown",
        dislikes: map.dislikes || "unknown"
    },
    notes: result,
    generatedAt: Date.now()
};

if (char.social.profile.ultimate !== "unknown") {
    char.ultimate = char.social.profile.ultimate;
}

saveCharacters();
return char.social.notes;
    } catch (err) {
        console.error("[Dangan][Social] Generation failed:", err);
        return "ultimate: unknown\nheight: unknown\nmeasurements: unknown\npersonality: unknown";
    }
}

let sfx = {};
function playSfx(sound) {
    if (!sound) return;
    sound.currentTime = 0;
    sound.volume = 0.5;
    sound.play().catch(() => {});
}

let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    Object.values(sfx).forEach(sound => {
        if (!sound) return;
        sound.volume = 0;
        sound.play().catch(() => {});
        sound.pause();
        sound.currentTime = 0;
        sound.volume = 0.5;
    });

    console.log("[Dangan] Audio unlocked");
}

function playTrustRankUp(previous, current) {
    unlockAudio();
    const overlay = document.getElementById("trust-rankup-overlay");
    const svg = document.getElementById("trust-decagram");
    const banner = document.getElementById("trust-rankup-banner");

    if (!overlay || !svg) return;

    overlay.classList.add("show");
    banner.classList.remove("show");

    banner.textContent = "TRUST INCREASED!";

    buildDecagram(svg, previous);

    // SFX here
    playSfx(sfx.trust_up);

    setTimeout(() => {
        buildDecagram(svg, current);
        banner.classList.add("show");
    }, 600);

    setTimeout(() => {
        overlay.classList.remove("show");
        banner.classList.remove("show");
    }, 2000);
}

function playTrustRankDown(previous, current) {
    unlockAudio();

    const overlay = document.getElementById("trust-rankup-overlay");
    const svg = document.getElementById("trust-decagram");
    const banner = overlay.querySelector(".trust-banner");

    if (!overlay || !svg) return;

    overlay.classList.add("show");
    banner.classList.remove("show");
    banner.textContent = "TRUST DECREASED...";

    // Draw full previous state
    buildDecagram(svg, previous);

    playSfx(sfx.trust_down || sfx.monokumasad);

    // :boom: Shatter the last filled shard
    setTimeout(() => {
        shatterShard(svg, previous - 1);
    }, 120);

    // Redraw reduced state
    setTimeout(() => {
        buildDecagram(svg, current);
        banner.classList.add("show");
    }, 300);

    // Exit fast
    setTimeout(() => {
        overlay.classList.remove("show");
        banner.classList.remove("show");
    }, 900);
}

function playTrustMaxed() {
    unlockAudio();

    const overlay = document.getElementById("trust-rankup-overlay");
    const svg = document.getElementById("trust-decagram");
    const banner = overlay.querySelector(".trust-banner");

    if (!overlay || !svg) return;

    svg.dataset.gold = "false";

    overlay.classList.add("show");
    banner.classList.remove("show");
    banner.textContent = "";

    // Draw 9 filled shards
    buildDecagram(svg, 9);

    // 🎵 Play max trust song
    playSfx(sfx.trust_max);

    // Pause for drama
    setTimeout(() => {
        const shards = svg.querySelectorAll("path");
        const finalShard = shards[9];

        if (finalShard) {
            finalShard.classList.add("final-shard");
            finalShard.setAttribute("fill", "url(#trustBlueGradient)");
        }
    }, 1200);

    // Turn everything gold
    setTimeout(() => {
        // Switch to gold (still hidden by )
svg.dataset.gold = "true";
buildDecagram(svg, 10);

const reveal = svg.querySelector("#goldRevealCircle");

if (reveal) {
    reveal.setAttribute("r", "0");

    reveal.animate(
        [
            { r: 0 },
            { r: 120 }
        ],
        {
            duration: 1400,
            easing: "ease-out",
            fill: "forwards"
        }
    );
}
    }, 2400);

    // Banner reveal
    setTimeout(() => {
        banner.textContent = "TRUST MAXED!";
        banner.classList.add("show");
    }, 2600);

// 🛑 Linger until user clicks (Rank 10 only)
const dismissOverlay = () => {
    overlay.classList.remove("show");
    banner.classList.remove("show");

    // 🔇 Stop max trust music immediately
    if (sfx.trust_max) {
    const audio = sfx.trust_max;
    const fade = setInterval(() => {
        audio.volume = Math.max(0, audio.volume - 0.05);
        if (audio.volume <= 0) {
            clearInterval(fade);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0.5; // reset default
        }
    }, 30);
}

    document.removeEventListener("click", dismissOverlay);
};

// Delay listener slightly so the same click that caused rank up doesn't dismiss it
setTimeout(() => {
    document.addEventListener("click", dismissOverlay, { once: true });
}, 300);

}

function normalizeList(text, max = 5) {
    if (!text || text === "unknown") return text;

    const items = text
        .split(",")
        .map(i => i.trim())
        .filter(Boolean);

    return [...new Set(items)].slice(0, max).join(", ");
}

function extractUltimateFromNotes(notes) {
    if (!notes) return null;

    const match = notes.match(/^ultimate:\s*(.+)$/im);
    if (!match) return null;

    const value = match[1].trim();
    return value !== "unknown" ? value : null;
}

function waitForRealChat(callback) {
    const maxTries = 50;
    let tries = 0;

    const interval = setInterval(() => {
        tries++;

        if (!window.SillyTavern?.getContext) return;

        const ctx = SillyTavern.getContext();
        const chat = ctx?.chat;

        if (Array.isArray(chat) && chat.length > 1) {
            clearInterval(interval);
            console.log("[Dangan][Social] Real chat detected");
            callback();
        }

        if (tries >= maxTries) {
            clearInterval(interval);
            console.warn("[Dangan][Social] Timed out waiting for real chat");
        }
    }, 200);
}

function getCharacterSourceText(charName) {
    let sources = [];

    // Character card (group chat)
    const ctx = SillyTavern?.getContext?.();
    const ch = ctx?.characters?.find(c =>
        normalizeName(c.name) === normalizeName(charName)
    );

    if (ch?.description) {
        sources.push(`CHARACTER CARD:\n${ch.description}`);
    }

    // Active lorebook
    const entries = window.world_info?.entries || [];
    entries.forEach(entry => {
        if (
            entry?.content &&
            entry.content.toLowerCase().includes(charName.toLowerCase())
        ) {
            sources.push(`LOREBOOK ENTRY:\n${entry.content}`);
        }
    });

    return sources.join("\n\n") || "NO SOURCE DATA AVAILABLE.";
}

function collectCharactersFromChat() {
    const profiles = [];

    for (const char of characters.values()) {
        if (!char?.name) continue;

        profiles.push({
            id: char.id,
            name: char.name,
            ultimate: char.ultimate,
            trustLevel: char.trustLevel,
            source: char.source,
        });
    }

    return profiles;
}

function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function isIgnoredCharacter(name) {
    if (!name) return true;

    const n = normalizeName(name);

    return (
        n === "assistant" ||
        n === "system" ||
        n === "narrator" ||
        n === "usami" ||
        n.includes("api") ||
        n.includes("helper") ||
        n.includes("assistant") ||
        n.includes("mono") ||
        n.includes("tool")
    );
}

function lookupUltimateFromLorebook(characterName) {
    const entries = window.world_info?.entries;
    if (!Array.isArray(entries)) return null;

    const normalized = normalizeName(characterName);

    for (const entry of entries) {
        if (!entry?.content) continue;

        const text = entry.content.toLowerCase();

        if (text.includes(normalized)) {
            const match = entry.content.match(/ultimate\s*[:\-]\s*(.+)/i);
            if (match) {
                return match[1].trim();
            }
        }
    }

    return null;
}

function debugSTGlobals() {
    const keys = [
        "SillyTavern",
        "SillyTavern?.context",
        "SillyTavern?.getContext",
        "chat",
        "characters",
        "chat_metadata",
        "groupChat",
    ];

    console.log("[Dangan][DEBUG] Global probe:");
    keys.forEach(k => {
        try {
            const value = eval(`window.${k}`);
            console.log(`  ${k}:`, value);
        } catch {
            console.log(`  ${k}: ❌`);
        }
    });
}

function registerCharactersFromContext() {
    if (!window.SillyTavern?.getContext) {
        console.warn("[Dangan][Social] SillyTavern context missing");
        return;
    }

    const ctx = SillyTavern.getContext();
    if (!Array.isArray(ctx.chat)) return;

    console.log(
        `[Dangan][Social] Scanning context messages: ${ctx.chat.length}`
    );

    let registered = 0;

    ctx.chat.forEach(msg => {
        if (!msg) return;
if (msg.is_user) return;
if (msg.is_system) return;

const charName = msg.ch_name || msg.name;
if (!charName) return;
if (isIgnoredCharacter(charName)) return;

const key = normalizeName(charName);
        
        if (characters.has(key)) return;

        const character = {
            id: `char_${Date.now()}_${Math.random()}`,
name: charName,
ultimate: lookupUltimateFromLorebook(charName),
            trustLevel: 1,
            source: "context",
            notes: null,
        };

        characters.set(key, character);
        registered++;
        console.log("[Dangan][Social] Registered character:", msg.name);
    });

    if (registered > 0) saveCharacters();

    console.log(
        `[Dangan][Social] Registered ${registered} character(s)`
    );
}

function registerCharacterFromMessage(msgEl) {
    const chName = msgEl.getAttribute("ch_name");
    const isUser = msgEl.getAttribute("is_user") === "true";
    const isSystem = msgEl.getAttribute("is_system") === "true";

    if (!chName) return;
    if (isUser || isSystem) return;
    if (isIgnoredCharacter(chName)) return;

    const key = normalizeName(chName);
    if (characters.has(key)) return;

    const character = {
        id: `char_${Date.now()}_${Math.random()}`,
        name: chName,
        ultimate: lookupUltimateFromLorebook(chName),
        trustLevel: 1,
        source: "dom",
        notes: null,
        trustHistory: new Set()
    };

    characters.set(key, character);
    saveCharacters();

    console.log("[Dangan][Social] Registered character:", chName);
    renderSocialPanel();
}

function playTruthBulletSfx() {
    if (!sfx.bullet_get) return;

    const useAlt = Math.random() < 0.3; // 30% chance
    const sound = useAlt && sfx.bullet_get_alt
        ? sfx.bullet_get_alt
        : sfx.bullet_get;

    playSfx(sound);
}

function loadSettings() {
    extension_settings[extensionName] ||= {};
    Object.assign(defaultSettings, extension_settings[extensionName]);

    $("#dangan_enable_checkbox").prop(
        "checked",
        extension_settings[extensionName].enabled
    );
    $("#dangan_fullscreen_checkbox").prop(
        "checked",
        extension_settings[extensionName].fullscreen
    );
}

function saveTruthBullets() {
    extension_settings[extensionName].truthBullets = truthBullets;
    saveSettingsDebounced();
}

function loadTruthBullets() {
    const saved = extension_settings[extensionName].truthBullets;
    if (!Array.isArray(saved)) return;

    truthBullets.length = 0;
    saved.forEach(tb => truthBullets.push(tb));
}

function saveCharacters() {
    const serialized = Array.from(characters.entries()).map(([key, char]) => {
        return [
            key,
            {
                ...char,
                trustHistory: Array.from(char.trustHistory || [])
            }
        ];
    });

    extension_settings[extensionName].characters = serialized;
    saveSettingsDebounced();
}

function loadCharacters() {
    const saved = extension_settings[extensionName].characters;
    if (!Array.isArray(saved)) return;

    characters.clear();

    saved.forEach(([key, value]) => {
        if (
            !value?.name ||
            value.name.length < 2 ||
            value.name === "..." ||
            value.name.toUpperCase().includes("API")
        ) {
            return; // 🚮 skip junk
        }

        // 🔑 Restore trustHistory as a Set
        value.trustHistory = new Set(
    Array.isArray(value.trustHistory)
        ? value.trustHistory
        : []
);

        characters.set(key, value);
    });
}

function applyFullscreenMode() {
    const isFullscreen = extension_settings[extensionName].fullscreen;
    $("#dangan_monopad_panel").toggleClass("fullscreen", isFullscreen);
}

function queueTruthBulletAnimation(title) {
    truthBulletQueue.push(title);
    runTruthBulletQueue();
}

function runTruthBulletQueue() {
    if (truthBulletAnimating) return;
    if (!truthBulletQueue.length) return;

    truthBulletAnimating = true;

    const title = truthBulletQueue.shift();
    const $overlay = $("#truth-obtained-overlay");
    const $title = $overlay.find(".truth-obtained-title");

    if (!$overlay.length) {
        truthBulletAnimating = false;
        runTruthBulletQueue();
        return;
    }

    $title.text(title.toUpperCase());

    $overlay.removeClass("show");
    void $overlay[0].offsetWidth;
    $overlay.addClass("show");

    playTruthBulletSfx();

    setTimeout(() => {
        $overlay.removeClass("show");
        truthBulletAnimating = false;
        runTruthBulletQueue(); // 🔁 play next bullet
    }, 1800); // MUST match CSS
}

/* =========================
   TRUTH BULLET FUNCTIONS
   ========================= */

function addTruthBullet(title, description = "") {
    if (!title) return;
    if (truthBullets.some(tb => tb.title === title)) return;

    const bullet = {
        id: `tb_${Date.now()}`,
        title,
        description,
        timestamp: new Date().toLocaleString()
    };

    truthBullets.push(bullet);
    insertTruthBulletUI(bullet);
    queueTruthBulletAnimation(title);
    saveTruthBullets();

    console.log(`[${extensionName}] Truth Bullet added: ${title}`);
}

function insertTruthBulletUI(bullet) {
    const $list = $(".truth-list-items");
    if (!$list.length) return;

    if ($list.find(`[data-id="${bullet.id}"]`).length) return;

    $list.find(".truth-empty").remove();

    const $item = $(`
        <div class="truth-item" data-id="${bullet.id}">
            ${bullet.title.toUpperCase()}
        </div>
    `);

    $list.append($item);

    $item.on("click", () => {
        $(".truth-item").removeClass("active");
        $item.addClass("active");
        showTruthBulletDetails(bullet);
    });
}

function showTruthBulletDetails(bullet) {
    const $details = $(".truth-details");
    if (!$details.length) return;

    $details.html(`
        <div class="truth-details-content">
            <div class="truth-title">${bullet.title}</div>
            <div class="truth-description">
                ${bullet.description || "No further details recorded."}
            </div>
            <div class="truth-meta">
                OBTAINED: ${bullet.timestamp}
            </div>

            <button class="truth-remove-button">
                DISCARD TRUTH BULLET
            </button>
        </div>
    `);

    $details.find(".truth-remove-button").on("click", () => {
        removeTruthBullet(bullet.id);
    });
}

function removeTruthBullet(id) {
    const index = truthBullets.findIndex(tb => tb.id === id);
    if (index === -1) return;

    truthBullets.splice(index, 1);
    saveTruthBullets();

    $(`.truth-item[data-id="${id}"]`).remove();
    $(".truth-details").empty();

    if (!truthBullets.length) {
        $(".truth-list-items")
            .append(`<div class="truth-empty">NO TRUTH BULLETS FOUND</div>`);
    }

    console.log(`[${extensionName}] Truth Bullet removed`);
}

function renderTruthBullets() {
    const $list = $(".truth-list-items");
    if (!$list.length) return;

    $list.empty();

    if (!truthBullets.length) {
        $list.append(`<div class="truth-empty">NO TRUTH BULLETS FOUND</div>`);
        return;
    }

    truthBullets.forEach(bullet => {
        insertTruthBulletUI(bullet);
    });
}

function renderSocialPanel() {
    const $panel = $(`.monopad-panel-content[data-panel="social"]`);
    if (!$panel.length) return;

    const $listItems = $panel.find(".social-list-items");
    $listItems.empty();

    if (!characters.size) {
        $listItems.append(`<div class="social-empty">NO STUDENTS FOUND</div>`);
        return;
    }

for (const [key, char] of characters.entries()) {
    const $item = $(`
        <div class="social-list-item">
            <span class="social-name">${char.name.toUpperCase()}</span>
            <span class="social-delete" title="Remove">✕</span>
        </div>
    `);

// LEFT CLICK → OPEN REPORT + TRIPLE CLICK → TRUST UP
let clickCount = 0;
let clickTimer = null;

$item.find(".social-name").on("click", () => {
    clickCount++;

    if (clickCount === 1) {
        // Normal single click behavior
        openCharacterReport(char);

        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 450); // timing window for triple click
    }

    if (clickCount === 3) {
        clearTimeout(clickTimer);
        clickCount = 0;

        increaseTrust(char);
    }
});

// RIGHT CLICK → TRUST DOWN
$item.find(".social-name").on("contextmenu", e => {
    e.preventDefault();
    decreaseTrust(char);
});

    // Delete button
    $item.find(".social-delete").on("click", e => {
        e.stopPropagation();
        removeCharacter(key);
    });

    $listItems.append($item);
}

}

function removeCharacter(key) {
    if (!characters.has(key)) return;

    const name = characters.get(key)?.name;
    characters.delete(key);
    saveCharacters();

    console.log(`[Dangan][Social] Removed character: ${name}`);
    renderSocialPanel();
}

function openCharacterReport(char) {
    activeSocialCharacterId = char.id;
    const $report = $(".social-report");
    if (!$report.length) return;

    $report.find(".report-name").text(char.name || "—");
const liveUltimate =
    lookupUltimateFromLorebook(char.name) || char.ultimate || "unknown";

char.ultimate = liveUltimate;
saveCharacters();

$report.find(".report-ultimate").text(
    char.ultimate
        ? `ULTIMATE: ${char.ultimate.toUpperCase()}`
        : "ULTIMATE: —"
);
// Trust bar
const trust = Math.max(1, Math.min(10, char.trustLevel || 1));
const $segments = $report.find(".trust-segment");

$segments.removeClass("filled distrust");

if (trust > 0) {
    // TRUST: fill from left
    $segments.each((i, el) => {
        if (i < trust) el.classList.add("filled");
    });

    $report.find(".trust-value").text(`${trust} / 10`);
    $report.find(".trust-label")
        .text("TRUST LEVEL")
        .removeClass("distrust");

} else {
    // DISTRUST: fill from right
    const abs = Math.abs(trust);

    $segments.each((i, el) => {
        if (i >= 10 - abs) el.classList.add("distrust");
    });

    $report.find(".trust-value").text(`${abs} / 10`);
    $report.find(".trust-label")
        .text("DISTRUST LEVEL")
        .addClass("distrust");
}

    $report.find(".trust-value").text(`${trust} / 10`);

$report.find(".notes-content").text("ANALYZING...");

const openedId = char.id;

generateCharacterNotes(char).then(() => {
    // 🛑 Only update if this character is still selected
    if (activeSocialCharacterId !== openedId) return;

    const profile = char.social?.profile;

    if (!profile) {
        console.warn("[Dangan][Social] Profile missing after generation");
        return;
    }

    $("#stat-height").text(profile.height || "—");
    $("#stat-measurements").text(profile.measurements || "—");
    $("#stat-personality").text(profile.personality || "—");
    $("#stat-likes").text(profile.likes || "—");
    $("#stat-dislikes").text(profile.dislikes || "—");

    $report.find(".notes-content").text("ANALYSIS COMPLETE");
});

}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        setTimeout(() => {
    //registerCharactersFromContext();
    renderSocialPanel();
}, 300);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        sfx = {
    open: document.getElementById("monopad_sfx_open"),
    close: document.getElementById("monopad_sfx_close"),
    click: document.getElementById("monopad_sfx_click"),
    hover: document.getElementById("monopad_sfx_hover"),
    monokuma: document.getElementById("monopad_sfx_monokuma"),
    monokumasad: document.getElementById("sfx_monokuma_sad"),       
    bullet_get: document.getElementById("bullet_sfx_get"),
    bullet_get_alt: document.getElementById("bullet_sfx_get_alt"),
    trust_up: document.getElementById("trust_sfx_up"),
    trust_down: document.getElementById("trust_sfx_down"),
    trust_max: document.getElementById("trust_sfx_max"),
};

        let lastHoverTime = 0;
        const HOVER_COOLDOWN = 80;

        let monopadSpamCount = 0;
        let monopadSpamTimer = null;
        let monokumaCooldown = false;

        function triggerMonokuma() {
            if (monokumaCooldown) return;
            monokumaCooldown = true;

            const $mono = $("#monokuma-popup");
            playSfx(sfx.monokuma);
            $mono.addClass("show");

            setTimeout(() => $mono.removeClass("show"), 1800);
            setTimeout(() => (monokumaCooldown = false), 6000);
        }

        $("#dangan_monopad_close").on("click", () => {
            $panel.removeClass("open booting").addClass("shutting-down");
            playSfx(sfx.close);

            setTimeout(() => {
                $panel.removeClass("shutting-down fullscreen").addClass("closed");
            }, 350);
        });

$(".monopad-icon").on("click", function () {
    playSfx(sfx.click);

    const tab = $(this).data("tab");

    $(".monopad-icon").removeClass("active");
    $(this).addClass("active");

    $(".monopad-panel-content").removeClass("active");
    $(`.monopad-panel-content[data-panel="${tab}"]`).addClass("active");

    if (tab === "truth") {
        renderTruthBullets();
    }

    if (tab === "social") {
        renderSocialPanel();
    }
});

/*$(document).on("chatLoaded", () => {
    //console.log("[Dangan][Social] Chat loaded, registering characters");

    //waitForRealChat(() => {
        //registerCharactersFromContext();
        renderSocialPanel();
    });
});
*/

//*$(document).on("chatChanged", () => {
  //  console.log("[Dangan][Social] Chat changed, registering characters");

   // waitForRealChat(() => {
       // registerCharactersFromContext();
       // renderSocialPanel();
    //});
//});

$(".monopad-icon").on("mouseenter", function () {
    const now = Date.now();
    if (now - lastHoverTime < HOVER_COOLDOWN) return;
    lastHoverTime = now;
    playSfx(sfx.hover);
});
        function togglePanel() {
            const isOpen = $panel.hasClass("open");
            $panel.removeClass("open closed booting");

            if (!isOpen) {
                $panel.addClass("open booting");
                setTimeout(() => $panel.removeClass("booting"), 450);
                playSfx(sfx.open);
            } else {
                $panel.addClass("shutting-down");
                playSfx(sfx.close);
                setTimeout(() => $panel.removeClass("shutting-down").addClass("closed"), 350);
            }

            applyFullscreenMode();
        }

        $button.on("click", () => {
            unlockAudio();
            togglePanel();

            monopadSpamCount++;
            clearTimeout(monopadSpamTimer);
            monopadSpamTimer = setTimeout(() => (monopadSpamCount = 0), 700);

            if (monopadSpamCount >= 6) {
                monopadSpamCount = 0;
                triggerMonokuma();
            }
        });

        $("#dangan_enable_checkbox").on("input", e => {
            extension_settings[extensionName].enabled = e.target.checked;
            saveSettingsDebounced();
        });

        $("#dangan_fullscreen_checkbox").on("input", e => {
            extension_settings[extensionName].fullscreen = e.target.checked;
            saveSettingsDebounced();
            applyFullscreenMode();
        });

loadSettings();
applyFullscreenMode();
loadTruthBullets();
loadCharacters();

// =========================
// TRUST DEBUG CONTROLS
// =========================

function getActiveSocialCharacter() {
    if (!activeSocialCharacterId) return null;

    for (const char of characters.values()) {
        if (char.id === activeSocialCharacterId) {
            return char;
        }
    }
    return null;
}

$("#trust-debug-up").on("click", () => {
    const char = getActiveSocialCharacter();
    if (!char) {
        console.warn("[Dangan][Debug] No active character");
        return;
    }
    increaseTrust(char);
});

$("#trust-debug-down").on("click", () => {
    const char = getActiveSocialCharacter();
    if (!char) {
        console.warn("[Dangan][Debug] No active character");
        return;
    }
    decreaseTrust(char);
});

// 🔴 FORCE REGISTER FROM EXISTING CHAT
//waitForRealChat(() => {
    //registerCharactersFromContext();
    //renderSocialPanel();
//});

debugSTGlobals();
startTruthBulletObserver();

    } catch (error) {
        console.error(`[${extensionName}] ❌ Load failed:`, error);
    }


function startTruthBulletObserver() {
    const chat = document.getElementById("chat");
    if (!chat) return;

    const TB_REGEX = /V3C\|\s*TB:\s*([^|\n\r]+)(?:\|\|\s*([^\n\r]+))?/g;

function processAllMessages() {
    const messages = document.querySelectorAll(".mes");

    messages.forEach(msgEl => {
        // 🔑 REGISTER CHARACTER FROM DOM
        registerCharacterFromMessage(msgEl);

        const msgText = msgEl.querySelector(".mes_text");
        if (!msgText) return;

        const rawText = msgText.textContent;

        // ---- Truth Bullets ----
        for (const match of rawText.matchAll(TB_REGEX)) {
            const title = match[1]?.trim();
            const description = match[2]?.trim() || "";
            if (!title) continue;

            const signature = `${title}||${description}`;
            if (processedTruthSignatures.has(signature)) continue;

            processedTruthSignatures.add(signature);
            addTruthBullet(title, description);
        }

// ---- Social Trust UP ----
for (const match of rawText.matchAll(SOCIAL_REGEX)) {
    const name = match[1]?.trim();
    if (!name) continue;

    const key = normalizeName(name);
    const char = characters.get(key);
    if (!char) continue;

    const signature = `UP||${key}||${rawText}`;

    // 🛑 Already used this message
    if (char.trustHistory.has(signature)) continue;

    char.trustHistory.add(signature);
    increaseTrust(char);
}

// ---- Social Trust DOWN ----
for (const match of rawText.matchAll(SOCIAL_DOWN_REGEX)) {
    const name = match[1]?.trim();
    if (!name) continue;

    const key = normalizeName(name);
    const char = characters.get(key);
    if (!char) continue;

    const signature = `DOWN||${key}||${rawText}`;

    // 🛑 Already used this message
    if (char.trustHistory.has(signature)) continue;

    char.trustHistory.add(signature);
    decreaseTrust(char);
}

        // ---- Marker Cleanup ----
       if (rawText.includes("V3C|")) {
    const walker = document.createTreeWalker(
        msgText,
        NodeFilter.SHOW_TEXT,
        null
    );

    let textNode;
    while ((textNode = walker.nextNode())) {
        if (textNode.nodeValue.includes("V3C|")) {
            textNode.nodeValue = textNode.nodeValue
                .replace(TB_REGEX, "")
                .replace(SOCIAL_REGEX, "")
                .replace(SOCIAL_DOWN_REGEX, "")
                .trimStart();
        }
    }
}
    });
}

    const observer = new MutationObserver(() => {
        processAllMessages();
    });

    observer.observe(chat, {
        childList: true,
        subtree: true
    });

    // 🟢 Initial pass (important for reloads & history)
    processAllMessages();

    console.log(`[${extensionName}] Truth Bullet observer active (swipe-safe)`);
}

});


//Global Trust Handlers
function increaseTrust(char) {
    if (!char) return;

    const previous = char.trustLevel ?? 1;

    // ❌ Hard cap
    if (previous >= 10) return;

    // ⬆️ From Distrust toward Trust
    if (previous < 0) {
        char.trustLevel = previous + 1;

        // Skip zero
        if (char.trustLevel === 0) {
            char.trustLevel = 1;
        }
    } else {
        char.trustLevel = previous + 1;
    }

    // 🎉 Max trust handling
    if (previous === 9 && char.trustLevel === 10) {
        playTrustMaxed();
    } else if (previous > 0) {
        playTrustRankUp(previous, char.trustLevel);
    }

    saveCharacters();

    console.log(
        `[Dangan][Social] Trust increased: ${char.name} → ${char.trustLevel}`
    );

    if ($(".monopad-panel-content[data-panel='social']").hasClass("active")) {
        openCharacterReport(char);
        renderSocialPanel();
    }
}

function decreaseTrust(char) {
    if (!char) return;

    const previous = char.trustLevel ?? 1;

    // ❌ Hard cap
    if (previous <= -10) return;

    // ⬇️ From Trust into Distrust
    if (previous > 0) {
        char.trustLevel = previous - 1;

        // Skip zero
        if (char.trustLevel === 0) {
            char.trustLevel = -1;
        }
    } else {
        char.trustLevel = previous - 1;
    }

    const svg = document.getElementById("trust-decagram");

    // 🔥 If dropping from MAX, instantly disable gold
    if (previous === 10 && svg) {
        delete svg.dataset.gold;
if (char.trustLevel < 0) {
    buildDecagram(svg, Math.abs(char.trustLevel), "distrust");
} else {
    buildDecagram(svg, char.trustLevel, "trust");
}

    // 🎬 Only play shatter animation if still in Trust
    if (previous > 0) {
        playTrustRankDown(previous, char.trustLevel);
    }

    saveCharacters();

    console.log(
        `[Dangan][Social] Trust decreased: ${char.name} → ${char.trustLevel}`
    );

    if ($(".monopad-panel-content[data-panel='social']").hasClass("active")) {
        openCharacterReport(char);
        renderSocialPanel();
    }
}

        function triggerTrustDecreaseMonokuma() {
    const $mono = $("#monokuma-trust-down");
    if (!$mono.length) return;

    playSfx(sfx.monokumasad);

    $mono.addClass("show");

    setTimeout(() => {
        $mono.removeClass("show");
    }, 2000);
}

function buildDecagram(svg, filled, mode = "trust") {
    const isGold = svg.dataset.gold === "true";

    svg.innerHTML = "";

    // ---- defs ----
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
<radialGradient id="trustBlueGradient">
    <stop offset="0%" stop-color="#2a4f7a"/>
    <stop offset="100%" stop-color="#142b44"/>
</radialGradient>

<radialGradient id="trustGoldGradient" cx="35%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#fff2b0"/>
    <stop offset="35%" stop-color="#ffd86b"/>
    <stop offset="65%" stop-color="#c79a2b"/>
    <stop offset="100%" stop-color="#7a5a12"/>
</radialGradient>

<radialGradient id="trustRedGradient" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="#ff6b6b"/>
    <stop offset="45%" stop-color="#e02222"/>
    <stop offset="100%" stop-color="#6b0f0f"/>
</radialGradient>

<mask id="goldRevealMask" maskUnits="userSpaceOnUse">
    <rect width="200" height="200" fill="black"/>
    <circle id="goldRevealCircle" cx="100" cy="100" r="0" fill="white"/>
</mask>

<filter id="goldInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
    <feOffset dx="0" dy="1"/>
    <feGaussianBlur stdDeviation="2"/>
    <feComposite operator="out" in2="SourceGraphic"/>
</filter>
`;
    svg.appendChild(defs);

    const center = 100;
    const radius = 90;

    for (let i = 0; i < 10; i++) {
        const angle1 = (Math.PI * 2 / 10) * i;
        const angle2 = (Math.PI * 2 / 10) * (i + 1);

        const x1 = center + Math.cos(angle1) * radius;
        const y1 = center + Math.sin(angle1) * radius;
        const x2 = center + Math.cos(angle2) * radius;
        const y2 = center + Math.sin(angle2) * radius;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        path.dataset.index = i;

        path.setAttribute(
            "d",
            `M ${center} ${center} L ${x1} ${y1} L ${x2} ${y2} Z`
        );

        // ✅ THIS IS WHERE THE FILL LOGIC GOES
        let fill;

if (mode === "distrust") {
    // Fill from RIGHT to LEFT
    const distrustIndex = 9 - i;

    fill = distrustIndex < filled
        ? "url(#trustRedGradient)"
        : "rgba(60, 10, 10, 0.35)";
}
else {
    fill = isGold
        ? "url(#trustGoldGradient)"
        : i < filled
            ? "url(#trustBlueGradient)"
            : "rgba(31, 58, 95, 0.25)";
}

        path.setAttribute("fill", fill);

// 🟡 ONLY mask during gold REVEAL animation
if (isGold && filled < 10) {
    path.setAttribute("mask", "url(#goldRevealMask)");
} else {
    path.removeAttribute("mask");
}


        path.setAttribute("stroke", "#0e2238");
        path.setAttribute("stroke-width", "1");

        svg.appendChild(path);
    }
}

function crackShard(svg, shardIndex) {
    const shard = svg.querySelector(
        `path[data-index="${shardIndex}"]`
    );

    if (!shard) return;

    shard.classList.add("trust-shard-crack");
}

function shatterShard(svg, index) {
    const shard = [...svg.querySelectorAll("path")]
        .find(p => Number(p.dataset.index) === index);

    if (!shard) return;

    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 40;

    shard.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    shard.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    shard.style.setProperty("--rot", `${(Math.random() * 90 - 45)}deg`);

    shard.classList.add("trust-shatter");
}
