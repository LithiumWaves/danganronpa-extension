// Shared sprite filename rules for the emotion sprite manager and runtime
// resolvers. SillyTavern's /api/sprites/get collapses `label` at the first
// '-' (so `pool-love.png` reports label `pool`, and `joy-1.png` reports `joy`).
// Filename stems are therefore the source of truth.
//
// Vanilla ST lets a character have several images for one expression:
//   joy.png, joy-1.png, joy_2.png, joy3.png
// This extension also uses `<prefix>-<emotion>` for location outfit locking:
//   pool-love.png
// `-half` crops are paired with their base and are not listed as their own
// emotion.

export const VFX_EMOTIONS = [
    "realization", "surprise", "fear", "anger", "joy", "excitement",
    "sadness", "grief", "nervousness", "disgust", "embarrassment", "love",
];

export const SPECIAL_SPRITES = ["scrumleft", "scrumright", "argumentarmament"];

export const MANAGED_SPRITES = ["neutral", ...VFX_EMOTIONS, ...SPECIAL_SPRITES];

const MANAGED_SET = new Set(MANAGED_SPRITES.map((e) => e.toLowerCase()));

// Minigame / UI sprites that must resolve to the exact filename, never a
// numbered extra picked at random.
export const EXACT_SPRITE_LABELS = new Set([
    "scrumleft",
    "scrumright",
    "argumentarmament",
    "mugshot",
    "interjection",
    "death-portrait",
]);

const HIDDEN_IMPORTS = new Set(["death-portrait", "mugshot", "dead"]);

const OUTFIT_EMOTIONS = new Set(["neutral", ...VFX_EMOTIONS]);

export function displayStem(sprite) {
    const base = String(sprite?.path || "").split("/").pop().split("?")[0];
    return base.replace(/\.[a-z0-9]+$/i, "");
}

export function spriteFileStem(sprite) {
    return displayStem(sprite).toLowerCase();
}

export function isHalfStem(stem) {
    return /-half$/i.test(String(stem || ""));
}

export function stripHalf(stem) {
    return String(stem || "").replace(/-half$/i, "");
}

function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Vanilla extras: joy-1, joy_1, joy1 (not pool-joy, not joy-half).
export function isNumberedExtraStem(stem, emotion) {
    const s = String(stem || "").toLowerCase();
    const e = String(emotion || "").toLowerCase();
    if (!s || !e) return false;
    return new RegExp(`^${escapeRe(e)}[-_]?\\d+$`).test(s);
}

// Location-outfit file: pool-love for emotion love. Prefix must be non-empty
// and not all digits (so "1-love" is not treated as an outfit).
export function isOutfitStem(stem, emotion) {
    const s = String(stem || "").toLowerCase();
    const e = String(emotion || "").toLowerCase();
    if (!s || !e) return false;
    const suffix = `-${e}`;
    if (!s.endsWith(suffix)) return false;
    const prefix = s.slice(0, -suffix.length);
    return prefix.length > 0 && !/^\d+$/.test(prefix);
}

// If `stem` is an outfit for a known managed emotion, return that emotion.
export function outfitEmotionOf(stem, known = MANAGED_SET) {
    const s = String(stem || "").toLowerCase();
    const idx = s.lastIndexOf("-");
    if (idx <= 0) return null;
    const suffix = s.slice(idx + 1);
    const prefix = s.slice(0, idx);
    if (!suffix || !prefix || /^\d+$/.test(prefix)) return null;
    if (known.has(suffix) || OUTFIT_EMOTIONS.has(suffix)) return suffix;
    return null;
}

export function classifyStem(stem, emotion) {
    const s = String(stem || "").toLowerCase();
    const e = String(emotion || "").toLowerCase();
    if (!s || !e) return null;
    if (s === e) return "primary";
    if (isNumberedExtraStem(s, e)) return "extra";
    if (isOutfitStem(s, e)) return "outfit";
    return null;
}

function labelOf(sprite) {
    return String(sprite?.label || "").toLowerCase();
}

// True when this sprite belongs to `emotion` as a playable (non-outfit) image,
// including vanilla extras and odd filenames whose ST label is the emotion.
export function stemMatchesPlayableEmotion(stem, emotion, sprite, known = MANAGED_SET) {
    const base = stripHalf(String(stem || "").toLowerCase());
    const kind = classifyStem(base, emotion);
    if (kind === "primary" || kind === "extra") return true;
    if (kind === "outfit") return false;
    if (labelOf(sprite) !== String(emotion || "").toLowerCase()) return false;
    const outfitFor = outfitEmotionOf(base, known);
    return !outfitFor || outfitFor === String(emotion || "").toLowerCase();
}

export function spritesForEmotion(sprites, emotion) {
    const list = Array.isArray(sprites) ? sprites : [];
    const lc = String(emotion || "").toLowerCase();
    let primary = null;
    const extras = [];
    const outfits = [];
    const seen = new Set();

    for (const s of list) {
        const shown = displayStem(s);
        const stem = shown.toLowerCase();
        if (!stem || isHalfStem(stem)) continue;
        if (seen.has(stem)) continue;

        const kind = classifyStem(stem, lc);
        if (kind === "primary") {
            seen.add(stem);
            primary = { ...s, stem: shown, kind };
            continue;
        }
        if (kind === "extra") {
            seen.add(stem);
            extras.push({ ...s, stem: shown, kind });
            continue;
        }
        if (kind === "outfit") {
            seen.add(stem);
            outfits.push({ ...s, stem: shown, kind });
            continue;
        }
        if (stemMatchesPlayableEmotion(stem, lc, s)) {
            seen.add(stem);
            extras.push({ ...s, stem: shown, kind: "extra" });
        }
    }

    extras.sort((a, b) => a.stem.localeCompare(b.stem));
    outfits.sort((a, b) => a.stem.localeCompare(b.stem));
    return { primary, extras, outfits };
}

function vanillaEmotionName(stem, label) {
    const base = stripHalf(String(stem || "").toLowerCase());
    if (!base) return "";
    if (outfitEmotionOf(base)) return "";
    for (const e of MANAGED_SET) {
        if (classifyStem(base, e)) return "";
    }
    const stripped = base.replace(/[-_]?\d+$/, "");
    if (stripped && stripped !== base && !stripped.endsWith("-") && !stripped.endsWith("_")) {
        return stripped;
    }
    if (!base.includes("-")) return base;
    const fromLabel = String(label || "").toLowerCase().replace(/-half$/i, "");
    if (fromLabel && !isHalfStem(fromLabel)) return fromLabel;
    return base.split("-")[0];
}

// Emotions present on disk that are not in the managed grid (vanilla imports
// and custom expression names).
export function importedEmotionsFromSprites(sprites, managedList = MANAGED_SPRITES) {
    const managed = new Set([...managedList].map((e) => String(e).toLowerCase()));
    const found = new Set();
    for (const s of Array.isArray(sprites) ? sprites : []) {
        const stem = spriteFileStem(s);
        if (!stem || isHalfStem(stem)) continue;
        const name = vanillaEmotionName(stem, s.label);
        if (name && !managed.has(name) && !HIDDEN_IMPORTS.has(name) && !HIDDEN_IMPORTS.has(stem)) found.add(name);
    }
    return [...found].sort();
}

export function nextExtraStem(emotion, existingStems) {
    const taken = new Set([...existingStems].map((s) => String(s).toLowerCase()));
    const e = String(emotion || "").toLowerCase();
    if (!e) return "sprite";
    if (!taken.has(e)) return e;
    for (let i = 1; i < 200; i++) {
        const stem = `${e}-${i}`;
        if (!taken.has(stem)) return stem;
    }
    return `${e}-${Date.now()}`;
}

export function sanitiseStem(raw) {
    return String(raw ?? "")
        .trim()
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "")
        .toLowerCase();
}

// Rename target for extras / outfits. Numbered extras stay numbered; anything
// else is forced to end in `-<emotion>` so outfit locking can find it.
export function normaliseEditableStem(raw, emotion) {
    const stem = sanitiseStem(raw);
    const e = String(emotion || "").toLowerCase();
    if (!stem) return "";
    if (stem === e || isNumberedExtraStem(stem, e)) return stem;
    const suffix = `-${e}`;
    if (stem.endsWith(suffix)) return stem;
    return `${stem}${suffix}`;
}

// Map a filename stem to the emotion it represents so VFX / expression lookup
// treat joy-1 and pool-love as joy / love.
export function emotionFromSpriteStem(stem, knownOutfitEmotions = OUTFIT_EMOTIONS) {
    let s = stripHalf(String(stem || "").toLowerCase().trim());
    if (!s) return "";
    const numbered = s.match(/^(.*?)[-_]?(\d+)$/);
    if (numbered?.[1]) {
        const base = numbered[1].replace(/[-_]$/, "");
        if (base) s = base;
    }
    const dash = s.lastIndexOf("-");
    if (dash > 0) {
        const suffix = s.slice(dash + 1);
        if (knownOutfitEmotions.has(suffix) || MANAGED_SET.has(suffix)) return suffix;
    }
    return s;
}

export function collectEmotionSprites(sprites, emotion, { exact = false } = {}) {
    const list = Array.isArray(sprites) ? sprites : [];
    const lc = String(emotion || "").toLowerCase();
    const full = [];
    const half = [];
    const seen = new Set();

    for (const s of list) {
        const stem = spriteFileStem(s);
        if (!stem) continue;
        const halfish = isHalfStem(stem);
        const base = halfish ? stripHalf(stem) : stem;
        if (exact) {
            if (base !== lc) continue;
        } else if (!stemMatchesPlayableEmotion(base, lc, s)) {
            continue;
        }
        const key = halfish ? `${base}-half` : base;
        if (seen.has(key)) continue;
        seen.add(key);
        (halfish ? half : full).push({ sprite: s, stem: base });
    }
    return { full, half };
}

export function pickVariant(list, seed) {
    if (!Array.isArray(list) || list.length === 0) return null;
    if (list.length === 1) return list[0];
    const i = Math.abs(seed | 0) % list.length;
    return list[i];
}

export function resolveEmotionPath(sprites, emotion, { preferHalf = false, seed = 0, exact = false } = {}) {
    const { full, half } = collectEmotionSprites(sprites, emotion, { exact });
    const chosenFull = pickVariant(full, seed);
    if (preferHalf) {
        if (chosenFull) {
            const paired = half.find((h) => h.stem === chosenFull.stem);
            return (paired || chosenFull).sprite?.path ?? null;
        }
        return pickVariant(half, seed)?.sprite?.path ?? null;
    }
    if (chosenFull) return chosenFull.sprite?.path ?? null;
    return pickVariant(half, seed)?.sprite?.path ?? null;
}

// Unique expression names a picker can request via getSpriteUrl. Numbered
// extras collapse to their base; outfit files count as their emotion, not as
// the vanilla first-hyphen label.
export function expressionLabelsFromSprites(sprites) {
    const labels = new Set();
    for (const s of Array.isArray(sprites) ? sprites : []) {
        const stem = spriteFileStem(s);
        if (!stem || isHalfStem(stem)) continue;
        const managed = classifyAgainstManaged(stem);
        if (managed) {
            if (!EXACT_SPRITE_LABELS.has(managed) && managed !== "dead") {
                labels.add(managed);
            }
            continue;
        }
        const name = vanillaEmotionName(stem, s.label);
        if (name && !EXACT_SPRITE_LABELS.has(name) && name !== "dead" && name !== "mugshot") {
            labels.add(name);
        }
    }
    return [...labels];
}

function classifyAgainstManaged(stem) {
    const base = stripHalf(stem);
    for (const e of MANAGED_SET) {
        if (classifyStem(base, e)) return e;
    }
    return outfitEmotionOf(base);
}
