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
    pirateLord: "",
    t1Seconds: 60,
    t2Seconds: 120,
    t3Seconds: 180,
    giftSeconds: 60,
    bitsSeconds: 300,
    donationSeconds: 300,
    sixMonthSubSeconds: 2100,
    fontFamily: "'Pirata One', 'Trebuchet MS', sans-serif",
    fontSize: 96,
    textColor: "#FFD85E",
    shadowColor: "#000000",
};

const STORE_KEY = 'se_sub_timer_v1';
let endAtMs = 0;
let paused = false;
let pausedAtMS = 0;

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
    window.tickHandle = setInterval(() => {
        render();
    }, cfg.tickMs);
}

function stopTick() {
    if (window.tickHandle)
        clearInterval(window.tickHandle);
    window.tickHandle = null;
}

function persistMaybe() {
    if (!cfg.persist) return;
    const payload = { endAtMs, version: 1 };
    console.log('Persisting timer to storage', (payload.endAtMs / 1000) / 60, 'minutes');
    SE_API.store.set(STORE_KEY, payload);
}

function tryRestore() {
    console.log('Trying to restore timer from storage, persist: ', cfg.persist);
    if (!cfg.persist) {
        console.log('Not persisting, skipping restore');
        return false;
    }

    SE_API.store.get(STORE_KEY).then(data => {
        if (typeof data.endAtMs === 'number' && data.endAtMs > now()) {
            console.log('Restored timer from storage', (data.endAtMs / 1000) / 60, 'minutes');
            endAtMs = data.endAtMs;
            return true;
        }
        else {
            console.log('No valid stored timer found, setting timer from start value');
            setFromStart();
            return false;
        }
    });
}

let specialCounter = 0;
let messages = buildMessages();

window.addEventListener('onWidgetLoad', function (obj) {
    console.log(obj);

    stopTick();
    if (window.messageInterval)
        clearInterval(window.messageInterval);
    window.messageInterval = null;

    const d = obj.detail || {};
    const f = d.fieldData || {};

    cfg.startSeconds = parseHHMMSS(f.startTime) || cfg.startSeconds;
    cfg.capMs = Math.max(0, Number(f.capHours || 0)) * 3600 * 1000;
    cfg.persist = f.persist;
    cfg.tickMs = clamp(Number(f.tickMs || cfg.tickMs), 50, 1000);

    cfg.t1Seconds = Math.max(0, Number(f.t1Seconds ?? cfg.t1Seconds));
    cfg.t2Seconds = Math.max(0, Number(f.t2Seconds ?? cfg.t2Seconds));
    cfg.t3Seconds = Math.max(0, Number(f.t3Seconds ?? cfg.t3Seconds));
    cfg.giftSeconds = Math.max(0, Number(f.giftSeconds ?? cfg.giftSeconds));
    cfg.bitsSeconds = Math.max(0, Number(f.bitsSeconds ?? cfg.bitsSeconds));
    cfg.donationSeconds = Math.max(0, Number(f.donationSeconds ?? cfg.donationSeconds));
    cfg.sixMonthSubSeconds = Math.max(0, Number(f.sixMonthSubSeconds ?? cfg.sixMonthSubSeconds));

    cfg.fontFamily = String(f.fontFamily || cfg.fontFamily);
    cfg.fontSize = Math.max(8, Number(f.fontSize || cfg.fontSize));
    cfg.textColor = String(f.textColor || cfg.textColor);
    cfg.shadowColor = String(f.shadowColor || cfg.shadowColor);

    elTimer = document.getElementById('timer');

    cfg.pirateLord = String(f.pirateLord || cfg.pirateLord);
    if (!cfg.pirateLord || cfg.pirateLord.trim() === "") {
        const pirateLordEl = document.getElementById('pirateLord');
        pirateLordEl.style.display = 'none';
        const subCountEl = document.getElementById('subCount');
        subCountEl.style.textAlign = 'center';
        subCountEl.style.flex = '1';
    }
    else {
        document.getElementById('pirateLord').textContent = `Pirate Lord: ${cfg.pirateLord}`;
    }
    document.getElementById('dynamicImage').src = f.rightImage;
    SE_API.store.get('special_counter').then(data => {
        console.log('Restored special counter from storage:', data);
        if (data && data.specialCounter) {
            specialCounter = data.specialCounter;
            console.log('Restored special counter from storage:', specialCounter);
            updateSpecialCounter();
        }
    });
    updateSubCount(d.session.data);

    messages = buildMessages();
    showNextMessage();
    window.messageInterval = setInterval(showNextMessage, 5000);

    tryRestore();
    render();
    startTick();
});

window.addEventListener('onEventReceived', function (obj) {
    console.log(obj);
    const d = obj.detail;
    if (!d) return;
    const ev = d.event || {};

    if (ev.listener && ev.listener === 'widget-button') {
        if (ev.field === 'resetBtn') {
            resetSubTimer();
            return;
        }
        else if (ev.field === 'pauseBtn') {
            paused = !paused;
            if (paused) {
                pausedAtMS = now();
                stopTick();
            } else {
                if (pausedAtMS) {
                    const pausedDuration = now() - pausedAtMS;
                    endAtMs += pausedDuration;
                    pausedAtMS = 0;
                    persistMaybe();
                }
                render();
                startTick();
            }
            return;
        }
        else if (ev.field === 'resetSpecialCounter') {
            specialCounter = 0;
            SE_API.store.set('special_counter', { specialCounter: specialCounter });
            updateSpecialCounter();
            return;
        }
    }

    let secondsToAdd = 0;

    console.log('Event received:', d.listener);
    if (d.listener.includes('subscriber') && ev.bulkGifted) {
        secondsToAdd += ev.amount * cfg.giftSeconds;
        if (ev.amount >= 50) {
            let multiplier = Math.floor(ev.amount / 50)
            specialCounter += multiplier;
            console.log('Incrementing special counter to', specialCounter);
            SE_API.store.set('special_counter', { specialCounter: specialCounter });
            updateSpecialCounter();
        }
    }
    else if (d.listener.includes('cheer') && ev.amount >= 500) {
        let multiplier = Math.floor(ev.amount / 500);
        secondsToAdd += (cfg.bitsSeconds * multiplier);
    }
    else if (d.listener.includes('tip') && ev.amount >= 5) {
        let multiplier = Math.floor(ev.amount / 5);
        console.log('Adding donation time, multiplier:', multiplier);
        secondsToAdd += (cfg.donationSeconds * multiplier);
    }
    else if (d.listener.includes('subscriber') && !ev.bulkGifted && !ev.gifted) {
        if (ev.amount == 6) {
            secondsToAdd += cfg.sixMonthSubSeconds;
        }
        else {
            const tier = String(ev.tier || '1000');
            if (tier === '1000') secondsToAdd += cfg.t1Seconds;
            else if (tier === '2000') secondsToAdd += cfg.t2Seconds;
            else if (tier === '3000') secondsToAdd += cfg.t3Seconds;
            else secondsToAdd += cfg.t1Seconds;

            const months = Math.max(1, Number(ev.amount || 1));
            secondsToAdd *= months;
        }
    }

    if (secondsToAdd > 0)
        addSeconds(secondsToAdd);
});

window.addEventListener('onSessionUpdate', function (obj) {
    const data = obj.detail.session;
    updateSubCount(data);
});

function updateSpecialCounter() {
    document.getElementById('imageCounter').textContent = specialCounter.toString();
}

window.resetSubTimer = function () {
    setFromStart();
    render();
};

function buildMessages() {
    return [
        // `Tier 1 sub = +${cfg.t1Seconds / 60} min`,
        // `Tier 2 sub = +${cfg.t2Seconds / 60} min`,
        // `Tier 3 sub = +${cfg.t3Seconds / 60} min`,
        // `Gifted sub = +${cfg.giftSeconds / 60} min`
        `Sub = +${cfg.t1Seconds / 60} min`,
        `500 Bits = +${cfg.bitsSeconds / 60} min`,
        `$5 = +${cfg.donationSeconds / 60} min`,
        `6 Month Sub = +${(cfg.sixMonthSubSeconds - 300) / 60} min + bonus 5 min`,
    ];
}

let messageIndex = 0;
const messageEl = document.getElementById('leftText');

function showNextMessage() {
    messages = buildMessages();
    messageEl.classList.remove('show');
    setTimeout(() => {
        messageEl.textContent = messages[messageIndex];
        messageEl.classList.add('show');
        messageIndex = (messageIndex + 1) % messages.length;
    }, 1000);
}

function updateSubCount(data) {
    const subCountEl = document.getElementById('subCount');
    subCountEl.textContent = `Subs: ${data["subscriber-total"]["count"]}`;
}