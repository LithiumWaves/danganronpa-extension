export const MONOKUMA_LESSON_TITLE = "Mr. Monokuma's Lesson - The Killing Game";

// Interactive orientation. waitFor:
//   "tap" | { type: "tap" }           — click overlay / continue hint
//   "acknowledge"                     — GOT IT on the dialogue box
//   { type: "click", selector }        — player must click the real UI
export const MONOKUMA_LESSON_STEPS = [
    {
        board: true,
        chalkTitle: MONOKUMA_LESSON_TITLE,
        sprite: "monokuma_eto.png",
        text: "Welcome, students. I'm your headmaster, Monokuma! This shiny Monopad is how you survive my killing game. Short lesson. Then you can go make terrible decisions.",
        waitFor: "tap",
    },
    {
        action: "spotlightTabs",
        sprite: "monokuma_cheerful.png",
        text: "Bottom strip: Truth, Map, Gifts, Social, Chapters, Settings. That's the whole toybox. Don't lose it. Don't eat it.",
        waitFor: "acknowledge",
        highlight: ".monopad-icon-strip",
    },
    {
        action: "dropAndSwitchToTruth",
        tab: "truth",
        sprite: "monokuma_cheerful.png",
        text: "Investigations dump evidence here as Truth Bullets. You don't type them in. When you find something, it shows up. Magical. Horrible. Convenient.",
        waitFor: "acknowledge",
        highlight: ".truth-list",
    },
    {
        action: "spawnLessonDummyBullet",
        sprite: "monokuma_tadam.png",
        text: "Like this one! Click it. I'm not doing your homework.",
        waitFor: { type: "click", selector: ".lesson-dummy-bullet" },
        highlight: ".lesson-dummy-bullet",
    },
    {
        action: "cleanupLessonDummyBullet",
        sprite: "monokuma_laugh.png",
        text: "Details on the right. Archive junk later if you like losing. Moving on!",
        waitFor: "tap",
    },
    {
        action: "dropAndSwitchToSocial",
        tab: "social",
        sprite: "monokuma_whimsyjoy.png",
        text: "Classmates. Click a name for their report. Hang out, gift them, watch trust climb… or shatter. People are the worst. That's why this is fun.",
        waitFor: "acknowledge",
        highlight: ".social-list",
    },
    {
        action: "dropAndSwitchToSkills",
        tab: "skills",
        sprite: "monokuma_idle.png",
        text: "Gifts and skills. Select one, press Use, and the next person who talks gets it. Good gifts win hearts. Bad ones make great television.",
        waitFor: "acknowledge",
        highlight: ".items-grid-panel",
    },
    {
        action: "throwAndSwitchToMap",
        tab: "map",
        sprite: "monokuma_tweaking.png",
        text: "A map. Shocking. Shop pins are my MonoMono Machine — spend Monocoins there. If a room looks wrong, add a pin and place it yourself. I believe in you. Barely.",
        waitFor: "acknowledge",
        highlight: ".map-image-wrap",
    },
    {
        board: true,
        sprite: "monokuma_idle.png",
        text: "When a body turns up, that's Class Trial time. Prep screen first: skills, bullets, then courtroom. I'll explain each minigame the first time it tries to ruin your day.",
        waitFor: "tap",
    },
    {
        board: true,
        sprite: "monokuma_eto.png",
        text: "That's the loop: investigate, collect, socialize, debate, repeat. I'll pop in when you hit something new. Now get out of my classroom before I start charging tuition!",
        waitFor: "tap",
    },
];
