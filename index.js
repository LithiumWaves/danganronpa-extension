import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        function positionPanel() {
            const buttonOffset = $button.offset();
            const buttonWidth = $button.outerWidth();
            const panelWidth = $panel.outerWidth();
            const viewportWidth = $(window).width();

            const buttonCenterX = buttonOffset.left + buttonWidth / 2;

            // Reset positioning
            $panel.css({ left: "auto", right: "auto" });

            if (buttonCenterX > viewportWidth / 2) {
                // Open to the LEFT
                $panel.css({
                    left: buttonOffset.left - panelWidth - 8,
                    top: buttonOffset.top
                });
            } else {
                // Open to the RIGHT
                $panel.css({
                    left: buttonOffset.left + buttonWidth + 8,
                    top: buttonOffset.top
                });
            }
        }

        // Toggle panel
        $button.on("click", () => {
            positionPanel();
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

        console.log(`[${extensionName}] ✅ Monopad directional logic loaded`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load Monopad:`, error);
    }
});
