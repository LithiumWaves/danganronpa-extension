import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    fullscreen: false
};

const truthBullets = [];

/* =========================
   Truth Bullet Functions
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
        </div>
    `);
}

/* =========================
   Settings Helpers
   ========================= */

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

function applyFullscreenMode() {
    const isFullscreen = extension_settings[extensionName].fullscreen;
    $("#dangan_monopad_panel").toggleClass("fullscreen", isFullscreen);
}

/* =========================
   Main Extension
   ========================= */

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        const sfx = {
            open: document.getElementById("monopad_sfx_open"),
            close: document.getElementById("monopad_sfx_close"),
            click: document.getElementById("monopad_sfx_click"),
            hover: document.getElementById("monopad_sfx_hover"),
            monokuma: document.getElementById("monopad_sfx_monokuma"),
        };

        function playSfx(sound) {
            if (!sound) return;
            sound.currentTime = 0;
            sound.volume = 0.5;
            sound.play().catch(() => {});
        }

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

        function renderTruthBullets() {
            const $list = $(".truth-list-items");
            if (!$list.length) return;

            $list.empty();

            if (!truthBullets.length) {
                $list.append(`<div class="truth-empty">NO TRUTH BULLETS FOUND</div>`);
                return;
            }

            truthBullets.forEach(insertTruthBulletUI);
        }

        $(".monopad-icon").on("click", function () {
            playSfx(sfx.click);
            const tab = $(this).data("tab");

            $(".monopad-icon").removeClass("active");
            $(this).addClass("active");

            $(".monopad-panel-content").removeClass("active");
            $(`.monopad-panel-content[data-panel="${tab}"]`).addClass("active");

            if (tab === "truth") renderTruthBullets();
        });

        $button.on("click", () => {
            $panel.toggleClass("open");
            playSfx(sfx.open);

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

        console.log(`[${extensionName}] ✅ Monopad stable`);

    } catch (err) {
        console.error(`[${extensionName}] ❌ Load failed`, err);
    }

    /* =========================
       Chat Listener
       ========================= */

    if (window.eventEmitter) {
        window.eventEmitter.on("CHAT_CHANGED", () => {
            const messages = window.chat;
            if (!Array.isArray(messages)) return;

            const last = [...messages].reverse().find(m => m?.mes);
            if (!last) return;

            const match = last.mes.match(/V3C\|\s*TB:\s*([^\n\r]+)/);
            if (!match) return;

            const title = match[1].trim();
            if (!title) return;

            addTruthBullet(title);

            last.mes = last.mes.replace(match[0], "").trimStart();
            const chatIndex = messages.indexOf(last);

            setTimeout(() => {
                const $chatMsg = $(`#chat .mes[mesid="${chatIndex}"] .mes_text`);
                if ($chatMsg.length) {
                    $chatMsg.html(
                        $chatMsg.html().replace(match[0], "").trimStart()
                    );
                }
            }, 0);
        });
    }
});
