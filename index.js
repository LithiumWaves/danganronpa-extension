import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

/* =========================
   Default Settings
   ========================= */

const defaultSettings = {
    enabled: false,
    fullscreen: false,
    sfx: true,
    crt: true,
    crtIntensity: 35,
    bootAnim: true
};

/* =========================
   Settings Load / Apply
   ========================= */

function loadSettings() {
    extension_settings[extensionName] ||= {};
    Object.assign(defaultSettings, extension_settings[extensionName]);

    $("#dangan_enable_checkbox").prop("checked", extension_settings[extensionName].enabled);
    $("#dangan_fullscreen_checkbox").prop("checked", extension_settings[extensionName].fullscreen);
    $("#dangan_sfx_checkbox").prop("checked", extension_settings[extensionName].sfx);
    $("#dangan_crt_checkbox").prop("checked", extension_settings[extensionName].crt);
    $("#dangan_crt_slider").val(extension_settings[extensionName].crtIntensity);
    $("#dangan_boot_checkbox").prop("checked", extension_settings[extensionName].bootAnim);
}

function applyFullscreenMode() {
    $("#dangan_monopad_panel").toggleClass(
        "fullscreen",
        extension_settings[extensionName].fullscreen
    );
}

/* =========================
   CRT Intensity
   ========================= */

function applyCrtSettings() {
    const intensity = extension_settings[extensionName].crtIntensity / 100;

    if (!extension_settings[extensionName].crt) {
        document.documentElement.style.setProperty("--crt-opacity", 0);
        document.documentElement.style.setProperty("--crt-glow", "0px");
        document.documentElement.style.setProperty("--crt-aberration", "0px");
        return;
    }

    document.documentElement.style.setProperty(
        "--crt-opacity",
        0.15 + intensity * 0.6
    );

    document.documentElement.style.setProperty(
        "--crt-glow",
        `${40 + intensity * 120}px`
    );

    document.documentElement.style.setProperty(
        "--crt-aberration",
        `${0.5 + intensity * 1.5}px`
    );
}

/* =========================
   Main Init
   ========================= */

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        /* Load UI */
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
        };

        function playSfx(sound, volume = 0.5) {
            if (!sound) return;
            if (!extension_settings[extensionName].sfx) return;

            sound.currentTime = 0;
            sound.volume = volume;
            sound.play().catch(() => {});
        }

        let lastHoverTime = 0;
        const HOVER_COOLDOWN = 80;

        /* =========================
           Close Button
           ========================= */

        $("#dangan_monopad_close").on("click", () => {
            if (extension_settings[extensionName].bootAnim) {
                $panel.removeClass("open booting").addClass("shutting-down");
                playSfx(sfx.close);

                setTimeout(() => {
                    $panel.removeClass("shutting-down fullscreen").addClass("closed");
                }, 350);
            } else {
                $panel.removeClass("open fullscreen").addClass("closed");
                playSfx(sfx.close);
            }
        });

        /* =========================
           Icon Handling
           ========================= */

        $(".monopad-icon").on("click", function () {
            playSfx(sfx.click);

            const tab = $(this).data("tab");

            $(".monopad-icon").removeClass("active");
            $(this).addClass("active");

            $(".monopad-panel-content").removeClass("active");
            $(`.monopad-panel-content[data-panel="${tab}"]`).addClass("active");
        });

        $(".monopad-icon").on("mouseenter", () => {
            const now = Date.now();
            if (now - lastHoverTime < HOVER_COOLDOWN) return;
            lastHoverTime = now;
            playSfx(sfx.hover, 0.25);
        });

        /* =========================
           Panel Positioning
           ========================= */

        function positionPanel() {
            if (extension_settings[extensionName].fullscreen) return;

            const offset = $button.offset();
            const bw = $button.outerWidth();
            const pw = $panel.outerWidth();
            const vw = $(window).width();

            const centerX = offset.left + bw / 2;
            $panel.css({ left: "auto", right: "auto" });

            if (centerX > vw / 2) {
                $panel.css({ left: offset.left - pw - 8, top: offset.top });
            } else {
                $panel.css({ left: offset.left + bw + 8, top: offset.top });
            }
        }

        /* =========================
           Toggle Panel
           ========================= */

        function togglePanel() {
            const isOpen = $panel.hasClass("open");

            $panel.removeClass("open closed booting shutting-down");

            if (!isOpen) {
                if (extension_settings[extensionName].bootAnim) {
                    $panel.addClass("open booting");
                    setTimeout(() => $panel.removeClass("booting"), 450);
                } else {
                    $panel.addClass("open");
                }

                playSfx(sfx.open);
                applyFullscreenMode();
                if (!extension_settings[extensionName].fullscreen) positionPanel();
            } else {
                if (extension_settings[extensionName].bootAnim) {
                    $panel.addClass("shutting-down");
                    playSfx(sfx.close);

                    setTimeout(() => {
                        $panel.removeClass("shutting-down").addClass("closed");
                    }, 350);
                } else {
                    $panel.addClass("closed");
                    playSfx(sfx.close);
                }
            }
        }

        $button.on("click", togglePanel);

        /* =========================
           Drag Button
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

            $button.css({
                left: e.clientX - offsetX,
                top: e.clientY - offsetY,
                right: "auto"
            });

            if ($panel.hasClass("open")) positionPanel();
        });

        $(document).on("mouseup", () => {
            isDragging = false;
            $button.css("cursor", "grab");
        });

        /* =========================
           Settings Handlers
           ========================= */

        $("#dangan_sfx_checkbox").on("input", e => {
            extension_settings[extensionName].sfx = e.target.checked;
            saveSettingsDebounced();
        });

        $("#dangan_crt_checkbox").on("input", e => {
            extension_settings[extensionName].crt = e.target.checked;
            saveSettingsDebounced();
            applyCrtSettings();
        });

        $("#dangan_crt_slider").on("input", e => {
            extension_settings[extensionName].crtIntensity = Number(e.target.value);
            saveSettingsDebounced();
            applyCrtSettings();
        });

        $("#dangan_boot_checkbox").on("input", e => {
            extension_settings[extensionName].bootAnim = e.target.checked;
            saveSettingsDebounced();
        });

        $("#dangan_fullscreen_checkbox").on("input", e => {
            extension_settings[extensionName].fullscreen = e.target.checked;
            saveSettingsDebounced();
            applyFullscreenMode();
        });

        loadSettings();
        applyFullscreenMode();
        applyCrtSettings();

        console.log(`[${extensionName}] ✅ Fully operational`);
    } catch (err) {
        console.error(`[${extensionName}] ❌ Failed to load`, err);
    }
});
