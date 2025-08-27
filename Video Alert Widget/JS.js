let cfg = {
    giftedSubVideo: "",
    sixMonthSubVideo: ""
};

window.addEventListener('onWidgetLoad', function (obj) {
    let fieldData = obj["detail"]["fieldData"];
    cfg.giftedSubVideo = fieldData.giftedSubVideo || "";
    cfg.sixMonthSubVideo = fieldData.sixMonthSubVideo || "";
});

window.addEventListener('onEventReceived', function (obj) {
    if (!obj.detail || !obj.detail.event) return;
    let event = obj.detail.event;
    let listener = obj.detail.listener;
    let testP = document.getElementById("testP");

    if (listener.includes("subscriber") && event.bulkGifted && event.amount >= 15) {
        testP.textContent = `onEventReceived - +15 gifted listener: ${listener}, amount: ${event.amount}, gifted: ${event.gifted}, bulk gifted: ${event.bulkGifted}, tier: ${event.tier}`;
        playVideo(cfg.giftedSubVideo);
    }

    if (listener.includes("subscriber") && !event.bulkGifted && !event.gifted && event.amount >= 6) {
        testP.textContent = `onEventReceived - sub 6 month listener: ${listener}, amount: ${event.amount}, gifted: ${event.gifted}, bulk gifted: ${event.bulkGifted}, tier: ${event.tier}`;
        playVideo(cfg.sixMonthSubVideo);
    }

    
});

function playVideo(videoUrl) {
    let videoEl = document.getElementById("videoElement");
    if (!videoEl) return;

    videoEl.src = videoUrl;
    videoEl.currentTime = 0;
    videoEl.play().catch(err => console.error("Autoplay issue:", err));
}