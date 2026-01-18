import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    fullscreen: false
};

const truthBullets = [];

const truthBulletQueue = [];
let truthBulletAnimating = false;

/* =========================
   SOCIAL / CHARACTER DATA
   ========================= */

const characters = new Map(); 
// key: normalized name → value: character object

async function generateCharacterNotes(char) {
    if (char.notes) return char.notes;

    const prompt = `
Generate a concise character report entry.
Name: ${char.name}
Ultimate: ${char.ultimate || "Unknown"}
Based on their card personality and dialogue.
Keep it short and clinical.
`;

    const result = await generate(prompt); // whatever AI hook you use
    char.notes = result;
    return result;
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

function processCharacterCard(text) {
    if (!text) return;

    // Attempt to extract name
    let name = null;

    // Format 1: Name: X
    const nameMatch = text.match(/name\s*[:\-]\s*(.+)/i);
    if (nameMatch) {
        name = nameMatch[1].trim();
    }

    // Format 2: First non-empty line
    if (!name) {
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length && lines[0].length <= 40) {
            name = lines[0];
        }
    }

    if (!name) return;

    const key = normalizeName(name);
    if (characters.has(key)) return;

    // Try Ultimate
    let ultimate = null;

    const cardUltimateMatch = text.match(/ultimate\s*[:\-]\s*(.+)/i);
    if (cardUltimateMatch) {
        ultimate = cardUltimateMatch[1].trim();
    } else {
        ultimate = lookupUltimateFromLorebook(name);
    }

    const character = {
        id: `char_${Date.now()}`,
        name,
        cardText: text,
        ultimate: ultimate,
        derivedProfile: null,
        trustLevel: 1,
        source: "card",
    };

characters.set(key, character);
saveCharacters();

console.log(`[Dangan][Social] Character registered from card:`, character);
}

function registerCharactersFromSillyTavern() {
    const context = window.getContext?.();
    if (!context) {
        console.warn("[Dangan][Social] No ST context found");
        return;
    }

    // Group chat
    const stCharacters =
        context.characters ||
        context.group?.characters ||
        [];

    if (!Array.isArray(stCharacters) || !stCharacters.length) {
        console.warn("[Dangan][Social] No characters in context");
        return;
    }

    stCharacters.forEach(stChar => {
        if (!stChar?.name) return;

        const key = normalizeName(stChar.name);
        if (characters.has(key)) return;

        const character = {
            id: `char_${Date.now()}_${Math.random()}`,
            name: stChar.name,
            ultimate: lookupUltimateFromLorebook(stChar.name),
            trustLevel: 1,
            source: "sillytavern",
            cardText: stChar.description || "",
            notes: null,
        };

        characters.set(key, character);

        console.log(
            "[Dangan][Social] Registered character:",
            character.name
        );
    });

    saveCharacters();
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
    extension_settings[extensionName].characters =
        Array.from(characters.entries());
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

    for (const char of characters.values()) {
        const $item = $(`
            <div class="social-list-item">
                ${char.name.toUpperCase()}
            </div>
        `);

        $item.on("click", () => {
            openCharacterReport(char);
        });

        $listItems.append($item);
    }
}

function openCharacterReport(char) {
    const $report = $(".social-report");
    if (!$report.length) return;

    $report.find(".report-name").text(char.name || "—");
    $report.find(".report-ultimate").text(
        `ULTIMATE: ${char.ultimate || "???"}`
    );

    // Trust bar
    const trust = Math.max(1, Math.min(10, char.trustLevel || 1));
    const $segments = $report.find(".trust-segment");

    $segments.removeClass("filled");
    $segments.each((i, el) => {
        if (i < trust) el.classList.add("filled");
    });

    $report.find(".trust-value").text(`${trust} / 10`);

$report.find(".notes-content").text("ANALYZING...");

generateCharacterNotes(char).then(notes => {
    $report.find(".notes-content").text(notes);
});
    
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        sfx = {
    open: document.getElementById("monopad_sfx_open"),
    close: document.getElementById("monopad_sfx_close"),
    click: document.getElementById("monopad_sfx_click"),
    hover: document.getElementById("monopad_sfx_hover"),
    monokuma: document.getElementById("monopad_sfx_monokuma"),
    bullet_get: document.getElementById("bullet_sfx_get"),
    bullet_get_alt: document.getElementById("bullet_sfx_get_alt"),
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
        registerCharactersFromSillyTavern();

        startTruthBulletObserver();
    } catch (error) {
        console.error(`[${extensionName}] ❌ Load failed:`, error);
    }

    
const processedTruthSignatures = new Set();
const processedSocialSignatures = new Set();

const SOCIAL_REGEX = /V3C\|\s*SOCIAL:\s*([^\n\r]+)/g;



function increaseTrust(char) {
    if (!char || char.trustLevel >= 10) return;

    char.trustLevel += 1;
    saveCharacters();

    console.log(
        `[Dangan][Social] Trust increased: ${char.name} → ${char.trustLevel}`
    );

    // Refresh UI if Social is open
    if ($(".monopad-panel-content[data-panel='social']").hasClass("active")) {
        openCharacterReport(char);
        renderSocialPanel();
    }
}
    
function startTruthBulletObserver() {
    const chat = document.getElementById("chat");
    if (!chat) return;

    const TB_REGEX = /V3C\|\s*TB:\s*([^|\n\r]+)(?:\|\|\s*([^\n\r]+))?/g;

function processAllMessages() {
    const messages = document.querySelectorAll(".mes_text");

    messages.forEach(msgText => {
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

        // ---- Social Trust ----
        for (const match of rawText.matchAll(SOCIAL_REGEX)) {
            const name = match[1]?.trim();
            if (!name) continue;

            const key = normalizeName(name);
            const signature = `${key}||${match[0]}`;

            if (processedSocialSignatures.has(signature)) continue;
            processedSocialSignatures.add(signature);

            const char = characters.get(key);
            if (char) {
                increaseTrust(char);
            }
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
