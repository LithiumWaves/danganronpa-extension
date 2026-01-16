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
        };

        function playSfx(sound) {
            if (!sound) return;
            sound.currentTime = 0;
            sound.volume = 0.5;
            sound.play().catch(() => {});
        }

        /* =========================
           Close Button
           ========================= */

        $("#dangan_monopad_close").on("click", () => {
            $panel.removeClass("open fullscreen").addClass("closed");
            playSfx(sfx.close);
            console.log(`[${extensionName}] Monopad closed via button`);
        });

        /* =========================
           Icon + Panel Switching
           ========================= */

        $(".monopad-icon").on("click", function () {
            playSfx(sfx.click);

            const tab = $(this).data("tab");

            $(".monopad-icon").removeClass("active");
            $(this).addClass("active");

            $(".monopad-panel-content").removeClass("active");
            $(`.monopad-panel-content[data-panel="${tab}"]`).addClass("active");

            console.log(`[${extensionName}] Switched to panel: ${tab}`);
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

            $panel
                .removeClass("open closed")
                .addClass(isOpen ? "closed" : "open");

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

        $button.on("click", togglePanel);

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

        loadSettings();
        applyFullscreenMode();

        console.log(`[${extensionName}] ✅ Monopad stable with SFX`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Load failed:`, error);
    }
});
