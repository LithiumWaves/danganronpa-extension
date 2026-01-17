import { eventSource, event_types, getContext } from "../../../../script.js";
import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    fullscreen: false
};

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

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        /* =========================
           Load UI
           ========================= */

        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        /* =========================
           Sound Effects
           ========================= */

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
        const HOVER_COOLDOWN = 80; // ms

        /* =========================
   Truth Bullets Data
   ========================= */

const truthBullets = [];


        function triggerMonokuma() {
    if (monokumaCooldown) return;
    monokumaCooldown = true;

    const $mono = $("#monokuma-popup");

    playSfx(sfx.monokuma);

    $mono.addClass("show");

    setTimeout(() => {
        $mono.removeClass("show");
    }, 1800);

    // Cooldown so it doesn't spam
    setTimeout(() => {
        monokumaCooldown = false;
    }, 6000);
}

        /* =========================
           Close Button
           ========================= */

$("#dangan_monopad_close").on("click", () => {
    $panel
        .removeClass("open booting")
        .addClass("shutting-down");

    playSfx(sfx.close);

    setTimeout(() => {
        $panel
            .removeClass("shutting-down fullscreen")
            .addClass("closed");
    }, 350);

    console.log(`[${extensionName}] Monopad shut down`);
});

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


        /* =========================
           Icon + Panel Switching
           ========================= */

        $(".monopad-icon").on("click", function () {
            playSfx(sfx.click);

            const tab = $(this).data("tab");
            
if (tab === "truth") {
    renderTruthBullets();
}
            $(".monopad-icon").removeClass("active");
            $(this).addClass("active");

            $(".monopad-panel-content").removeClass("active");
            $(`.monopad-panel-content[data-panel="${tab}"]`).addClass("active");

            console.log(`[${extensionName}] Switched to panel: ${tab}`);
        });

        $(".monopad-icon").on("mouseenter", function () {
    const now = Date.now();

    if (now - lastHoverTime < HOVER_COOLDOWN) return;
    lastHoverTime = now;

    playSfx(sfx.hover);
});

        /* =========================
           Panel Positioning
           ========================= */

        function positionPanel() {
            if (extension_settings[extensionName].fullscreen) return;

            const buttonOffset = $button.offset();
            const buttonWidth = $button.outerWidth();
            const panelWidth = $panel.outerWidth();
            const viewportWidth = $(window).width();

            const buttonCenterX = buttonOffset.left + buttonWidth / 2;

            $panel.css({ left: "auto", right: "auto" });

            if (buttonCenterX > viewportWidth / 2) {
                $panel.css({
                    left: buttonOffset.left - panelWidth - 8,
                    top: buttonOffset.top
                });
            } else {
                $panel.css({
                    left: buttonOffset.left + buttonWidth + 8,
                    top: buttonOffset.top
                });
            }
        }

        /* =========================
           Toggle Panel
           ========================= */

        function togglePanel() {
            const isOpen = $panel.hasClass("open");

$panel.removeClass("open closed booting");

if (!isOpen) {
    $panel.addClass("open booting");

    setTimeout(() => {
        $panel.removeClass("booting");
    }, 450);
} else {
    $panel
        .removeClass("open booting")
        .addClass("shutting-down");

    playSfx(sfx.close);

    setTimeout(() => {
        $panel
            .removeClass("shutting-down")
            .addClass("closed");
    }, 350);
}

            applyFullscreenMode();

            if (!extension_settings[extensionName].fullscreen && !isOpen) {
                positionPanel();
            }

            if (isOpen) {
                playSfx(sfx.close);
            } else {
                playSfx(sfx.open);
            }

            console.log(
                `[${extensionName}] Monopad ${isOpen ? "closed" : "opened"}`
            );
        }

$button.on("click", () => {
    togglePanel();

    monopadSpamCount++;

    clearTimeout(monopadSpamTimer);
    monopadSpamTimer = setTimeout(() => {
        monopadSpamCount = 0;
    }, 700);

    if (monopadSpamCount >= 6) {
        monopadSpamCount = 0;
        triggerMonokuma();
    }
});

        /* =========================
           Drag Logic
           ========================= */

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        $button.on("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - $button.offset().left;
            offsetY = e.clientY - $button.offset().top;
            $button.css("cursor", "grabbing");
        });

        $(document).on("mousemove", (e) => {
            if (!isDragging) return;

            const left = e.clientX - offsetX;
            const top = e.clientY - offsetY;

            $button.css({
                left,
                top,
                right: "auto"
            });

            if ($panel.hasClass("open")) {
                positionPanel();
            }
        });

        $(document).on("mouseup", () => {
            isDragging = false;
            $button.css("cursor", "grab");
        });


        let monopadSpamCount = 0;
        let monopadSpamTimer = null;
        let monokumaCooldown = false;

        function addTruthBullet(title, description = "") {
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

    if (!$list.length) {
        console.warn(`[${extensionName}] Truth list not ready, deferring UI insert`);
        return;
    }

    if ($list.find(`[data-id="${bullet.id}"]`).length) return;

    $(".truth-empty").hide();

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

    $details.empty().append(`
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
           Settings Handlers
           ========================= */

        $("#dangan_enable_checkbox").on("input", (e) => {
            extension_settings[extensionName].enabled = e.target.checked;
            saveSettingsDebounced();
        });

        $("#dangan_fullscreen_checkbox").on("input", (e) => {
            extension_settings[extensionName].fullscreen = e.target.checked;
            saveSettingsDebounced();
            applyFullscreenMode();
        });

/* =========================
   Truth Bullet Listener (ST-native, correct)
   ========================= */

eventSource.on(event_types.CHAT_CHANGED, () => {
    const context = getContext();
    if (!context || !Array.isArray(context.chat) || !context.chat.length) return;

    const lastMsg = context.chat[context.chat.length - 1];
    if (!lastMsg || typeof lastMsg.mes !== "string") return;

    // Match anywhere, stop at newline
    const match = lastMsg.mes.match(/V3C\|\s*TB:\s*([^\n\r]+)/);
    if (!match) return;

    const title = match[1].trim();
    if (!title) return;

    // Add bullet
    addTruthBullet(title);

    // Remove prefix from visible chat
    lastMsg.mes = lastMsg.mes.replace(match[0], "").trimStart();

    // Force re-render
    eventSource.emit(event_types.CHAT_CHANGED);

    console.log(`[${extensionName}] Truth Bullet detected: ${title}`);
});
        loadSettings();
        applyFullscreenMode();

        console.log(`[${extensionName}] ✅ Monopad stable with SFX`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Load failed:`, error);
    }
});
