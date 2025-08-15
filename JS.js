const pad2 = (n) => String(Math.floor(n)).padStart(2, '0');
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function parseHHMMSS(s) {
    if (typeof s === 'number') return Math.max(0, s);
    if (!s) return 0;
    if (/^\d+$/.test(s)) return Math.max(0, parseInt(s, 10));
    const parts = s.split(':').map(x => parseInt(x, 10) || 0);
    if (parts.length === 3) {
        const [h, m, sec] = parts;
        return h * 3600 + m * 60 + sec;
    }
    if (parts.length === 2) {
        const [m, sec] = parts;
        return m * 60 + sec;
    }
    return 0;
}

function formatHHMMSS(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

let elTimer;
let cfg = {
    startSeconds: 3600,
    capMs: 0,
    tickMs: 250,
    persist: true,

    t1Seconds: 60,
    t2Seconds: 120,
    t3Seconds: 180,
    giftSeconds: 60,

    fontFamily: "'Pirata One', 'Trebuchet MS', sans-serif",
    fontSize: 96,
    textColor: "#FFD85E",
    shadowColor: "#000000",
};

const STORE_KEY = 'se_sab_timer_v1';
let endAtMs = 0;
let paused = false;
let tickHandle = null;

function now() { return Date.now(); }

function setFromStart() {
    const ms = cfg.startSeconds * 1000;
    endAtMs = now() + ms;
    persistMaybe();
}

function applyCap() {
    if (cfg.capMs > 0) {
        const maxEnd = now() + cfg.capMs;
        if (endAtMs > maxEnd) endAtMs = maxEnd;
    }
}

function addSeconds(seconds) {
    if (seconds <= 0) return;
    const addMs = seconds * 1000;
    endAtMs = Math.max(endAtMs, now()) + addMs;
    applyCap();
    persistMaybe();
}

function remainingMs() {
    return Math.max(0, endAtMs - now());
}

function render() {
    const secs = Math.round(remainingMs() / 1000);
    elTimer.textContent = formatHHMMSS(secs);
}

function startTick() {
    stopTick();
    tickHandle = setInterval(() => {
        render();
    }, cfg.tickMs);
}
function stopTick() {
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = null;
}

function persistMaybe() {
    if (!cfg.persist) return;
    try {
        const payload = { endAtMs, version: 1 };
        localStorage.setItem(STORE_KEY, JSON.stringify(payload));
    } catch (e) { }
}

function tryRestore() {
    if (!cfg.persist) return false;
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (typeof data.endAtMs === 'number' && data.endAtMs > now()) {
            endAtMs = data.endAtMs;
            return true;
        }
    } catch (e) { }
    return false;
}

let hints = buildHints();

window.addEventListener('onWidgetLoad', function (obj) {
    const d = obj.detail || {};
    const f = d.fieldData || {};

    cfg.startSeconds = parseHHMMSS(f.startTime) || cfg.startSeconds;
    cfg.capMs = Math.max(0, Number(f.capHours || 0)) * 3600 * 1000;
    cfg.persist = !!f.persist;
    cfg.tickMs = clamp(Number(f.tickMs || cfg.tickMs), 50, 1000);

    cfg.t1Seconds = Math.max(0, Number(f.t1Seconds ?? cfg.t1Seconds));
    cfg.t2Seconds = Math.max(0, Number(f.t2Seconds ?? cfg.t2Seconds));
    cfg.t3Seconds = Math.max(0, Number(f.t3Seconds ?? cfg.t3Seconds));
    cfg.giftSeconds = Math.max(0, Number(f.giftSeconds ?? cfg.giftSeconds));

    cfg.fontFamily = String(f.fontFamily || cfg.fontFamily);
    cfg.fontSize = Math.max(8, Number(f.fontSize || cfg.fontSize));
    cfg.textColor = String(f.textColor || cfg.textColor);
    cfg.shadowColor = String(f.shadowColor || cfg.shadowColor);

    const root = document.documentElement;
    root.style.setProperty('--font-family', cfg.fontFamily);
    root.style.setProperty('--font-size', `${cfg.fontSize}px`);
    root.style.setProperty('--color', cfg.textColor);
    root.style.setProperty('--shadow', cfg.shadowColor);

    elTimer = document.getElementById('timer');

    hints = buildHints();
    showNextHint();
    setInterval(showNextHint, 5000);

    if (!tryRestore()) {
        setFromStart();
    } else {
        applyCap();
    }

    render();
    startTick();
});

window.addEventListener('onEventReceived', function (obj) {
    const d = obj.detail;
    if (!d) return;

    const listener = d.listener || '';
    const ev = d.event || {};

    if (ev.listener === 'widget-button') {
        if (ev.field === 'resetBtn') {
            resetSabTimer();
            return;
        }
    }

    if (!listener.includes('subscriber')) return;

    let secondsToAdd = 0;

    if (ev.gifted) {
        const count = Math.max(1, Number(ev.amount || 1));
        secondsToAdd += count * cfg.giftSeconds;
    } else {
        const tier = String(ev.tier || '1000');
        if (tier === '1000') secondsToAdd += cfg.t1Seconds;
        else if (tier === '2000') secondsToAdd += cfg.t2Seconds;
        else if (tier === '3000') secondsToAdd += cfg.t3Seconds;
        else secondsToAdd += cfg.t1Seconds;
    }

    addSeconds(secondsToAdd);
});

window.resetSabTimer = function () {
    setFromStart();
    render();
};

function buildHints() {
    return [
        `Tier 1 sub = +${cfg.t1Seconds / 60} min`,
        `Tier 2 sub = +${cfg.t2Seconds / 60} min`,
        `Tier 3 sub = +${cfg.t3Seconds / 60} min`,
        `Gifted sub = +${cfg.giftSeconds / 60} min`
    ];
}

let hintIndex = 0;
const hintEl = document.getElementById('hint');

function showNextHint() {
    hints = buildHints();
    hintEl.classList.remove('show');
    setTimeout(() => {
        hintEl.textContent = hints[hintIndex];
        hintEl.classList.add('show');
        hintIndex = (hintIndex + 1) % hints.length;
    }, 1000);
}