import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    fullscreen: false
};

const truthBullets = [];

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

function applyFullscreenMode() {
    const isFullscreen = extension_settings[extensionName].fullscreen;
    $("#dangan_monopad_panel").toggleClass("fullscreen", isFullscreen);
}

function playTruthBulletAnimation(title) {
    const $overlay = $("#truth-obtained-overlay");
    const $title = $overlay.find(".truth-obtained-title");

    if (!$overlay.length) return;

    $title.text(title.toUpperCase());

    // Reset animation state
    $overlay.removeClass("show");
    void $overlay[0].offsetWidth; // force reflow
    $overlay.addClass("show");

    // HARD EXIT after animation finishes
    setTimeout(() => {
        $overlay.removeClass("show");
    }, 1800); // MUST match CSS duration
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
    playTruthBulletAnimation(title);
    playTruthBulletSfx();
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

        startTruthBulletObserver();
    } catch (error) {
        console.error(`[${extensionName}] ❌ Load failed:`, error);
    }

function startTruthBulletObserver() {
    const chat = document.getElementById("chat");
    if (!chat) return;

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;

                const msgText = node.querySelector?.(".mes_text");
                if (!msgText) continue;

const rawText = msgText.textContent;
const match = rawText.match(/V3C\|\s*TB:\s*([^\n\r]+)/);
if (!match) continue;

const title = match[1].trim();
if (!title) continue;

addTruthBullet(title);

                // Remove tag from visible message
                /* 🔥 REMOVE ONLY THE TAG WITHOUT NUKING FORMATTING */
const walker = document.createTreeWalker(
    msgText,
    NodeFilter.SHOW_TEXT,
    null
);

let textNode;
while ((textNode = walker.nextNode())) {
    if (textNode.nodeValue.includes(match[0])) {
        textNode.nodeValue = textNode.nodeValue.replace(match[0], "").trimStart();
        break;
    }
}

    observer.observe(chat, {
        childList: true,
        subtree: true
    });

    console.log(`[${extensionName}] Truth Bullet observer active`);
}
});

