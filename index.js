import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        // Load Monopad UI
        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        // Toggle panel on click
        $button.on("click", () => {
            $panel.toggleClass("hidden");
            console.log(`[${extensionName}] Monopad toggled`);
        });

        // Drag logic
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

            $button.css({
                left: e.clientX - offsetX,
                top: e.clientY - offsetY,
                right: "auto"
            });

            $panel.css({
                left: e.clientX - offsetX,
                top: e.clientY - offsetY + 60,
                right: "auto"
            });
        });

        $(document).on("mouseup", () => {
            isDragging = false;
            $button.css("cursor", "grab");
        });

        console.log(`[${extensionName}] ✅ Monopad base loaded`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load Monopad:`, error);
    }
});
