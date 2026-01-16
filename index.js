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
        // Load settings UI
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        // Load Monopad UI
        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        // ---- PANEL POSITIONING ----
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

        // ---- CLICK TO TOGGLE ----
        $button.on("click", () => {
            applyFullscreenMode();
            positionPanel();
            $panel.toggleClass("hidden");
            console.log(`[${extensionName}] Monopad toggled`);
        });

        // ---- DRAG LOGIC ----
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

            if (!$panel.hasClass("hidden")) {
                positionPanel();
            }
        });

        $(document).on("mouseup", () => {
            isDragging = false;
            $button.css("cursor", "grab");
        });

        // ---- SETTINGS HANDLERS ----
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

        console.log(`[${extensionName}] ✅ Monopad fully restored`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Load failed:`, error);
    }
});
