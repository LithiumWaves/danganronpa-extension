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
        /* Settings UI */
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        /* Monopad UI */
        const monopadHtml = await $.get(`${extensionFolderPath}/monopad.html`);
        $("body").append(monopadHtml);

        const $button = $("#dangan_monopad_button");
        const $panel = $("#dangan_monopad_panel");

        $("#dangan_monopad_close").on("click", () => {
    $panel.removeClass("open fullscreen").addClass("closed");
    console.log(`[${extensionName}] Monopad closed via button`);
});

        /* Monopad icon selection */
/* Monopad icon + panel switching */
$(".monopad-icon").on("click", function () {
    const tab = $(this).data("tab");

    // Icon state
    $(".monopad-icon").removeClass("active");
    $(this).addClass("active");

    // Panel state
    $(".monopad-panel-content").removeClass("active");
    $(`.monopad-panel-content[data-panel="${tab}"]`).addClass("active");

    console.log(`[${extensionName}] Switched to panel: ${tab}`);
});
        /* Panel positioning */
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

        /* Toggle panel (SINGLE SOURCE OF TRUTH) */
        function togglePanel() {
            const isOpen = $panel.hasClass("open");

            $panel
                .removeClass("open closed")
                .addClass(isOpen ? "closed" : "open");

            applyFullscreenMode();

            if (!extension_settings[extensionName].fullscreen && !isOpen) {
                positionPanel();
            }

            console.log(
                `[${extensionName}] Monopad ${isOpen ? "closed" : "opened"}`
            );
        }

        /* Click handler */
        $button.on("click", togglePanel);

        /* Drag logic */
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

        /* Settings handlers */
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

        console.log(`[${extensionName}] ✅ Monopad stable`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Load failed:`, error);
    }
});
