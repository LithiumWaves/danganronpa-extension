import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "danganronpa-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    fullscreen: false
};

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

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
       State
       ========================= */

    let monopadSpamCount = 0;
    let monopadSpamTimer = null;
    let monokumaCooldown = false;

    const truthBullets = [];
    const TB_REGEX = /<!--\s*TB:\s*(.*?)\s*-->/g;

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

    /* =========================
       Truth Bullet Logic
       ========================= */

    function addTruthBullet(title) {
        if (truthBullets.some(tb => tb.title === title)) return;

        const bullet = {
            id: `tb_${Date.now()}`,
            title,
            timestamp: new Date().toLocaleString()
        };

        truthBullets.push(bullet);
        insertTruthBulletUI(bullet);

        console.log(`[${extensionName}] Truth Bullet added: ${title}`);
    }

    function insertTruthBulletUI(bullet) {
        const $list = $(".truth-list-items");
        const $empty = $(".truth-empty");

        if (!$list.length) return;

        $empty.hide();

        const $item = $(`
            <div class="truth-item">
                ${bullet.title.toUpperCase()}
            </div>
        `);

        $list.append($item);

        $item.on("click", () => {
            $(".truth-item").removeClass("active");
            $item.addClass("active");

            $(".truth-details").html(`
                <div class="truth-details-content">
                    <div class="truth-title">${bullet.title}</div>
                    <div class="truth-description">
                        No further details recorded.
                    </div>
                    <div class="truth-meta">
                        OBTAINED: ${bullet.timestamp}
                    </div>
                </div>
            `);
        });
    }

    function scanMessageForTruthBullets(html) {
        let match;
        while ((match = TB_REGEX.exec(html)) !== null) {
            addTruthBullet(match[1].trim());
        }
    }

    function observeChat() {
        const chat = document.querySelector("#chat");
        if (!chat) return;

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLElement) {
                        scanMessageForTruthBullets(node.innerHTML);
                    }
                }
            }
        });

        observer.observe(chat, { childList: true, subtree: true });
        console.log(`[${extensionName}] Truth Bullet observer active`);
    }

    observeChat();

    /* =========================
       Panel Toggle
       ========================= */

    function togglePanel() {
        const isOpen = $panel.hasClass("open");

        $panel.removeClass("open closed");

        if (isOpen) {
            $panel.addClass("closed");
            playSfx(sfx.close);
        } else {
            $panel.addClass("open");
            playSfx(sfx.open);
        }
    }

    $button.on("click", () => {
        togglePanel();

        monopadSpamCount++;
        clearTimeout(monopadSpamTimer);

        monopadSpamTimer = setTimeout(() => {
            monopadSpamCount = 0;
        }, 700);

        if (monopadSpamCount >= 6 && !monokumaCooldown) {
            monokumaCooldown = true;
            playSfx(sfx.monokuma);
            setTimeout(() => (monokumaCooldown = false), 6000);
        }
    });

    console.log(`[${extensionName}] ✅ Monopad loaded`);
});
