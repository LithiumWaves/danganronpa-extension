import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// MUST match folder name exactly
const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
