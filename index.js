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

    $("#dangan_enable_checkbox").prop("checked", extension_settings[extensionName].enabled);
    $("#dangan_fullscreen_checkbox").prop("checked", extension_settings[extensionName].fullscreen);

    applyFullscreenMode();
}

function applyFullscreenMode() {
    const isFullscreen = extension_settings[extensionName].fullscreen;
    $("#dangan_monopad_panel").toggleClass("fullscreen", isFullscreen);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        // Settings UI
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        // Monopad UI
        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        // Toggle panel
        $button.on("click", () => {
            applyFullscreenMode();
            $panel.toggleClass("hidden");
        });

        // Settings handlers
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

        console.log(`[${extensionName}] ✅ Fullscreen mode ready`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Load failed:`, error);
    }
});
