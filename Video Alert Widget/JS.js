let cfg = {
    upTo10GiftedVideos: [],
    upTo25GiftedVideos: [],
    upTo50GiftedVideos: [],
    hundredGiftedVideos: [],
    sixMonthSubVideos: []
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

    if (listener.includes("subscriber") && event.bulkGifted) {
        if (event.amount >= 100) {
            playVideo(cfg.hundredGiftedVideos);
        }
        else if (event.amount >= 50) {
            playVideo(cfg.upTo50GiftedVideo);
        }
        else if (event.amount >= 25) {
            playVideo(cfg.upTo25GiftedVideo);
        }
        else if (event.amount >= 10) {
            playVideo(cfg.upTo10GiftedVideo);
        }
    }
    else if (listener.includes("subscriber") && !event.bulkGifted && !event.gifted && event.amount >= 6) {
        playVideo(cfg.sixMonthSubVideos);
    }


});

function playVideo(videoUrls) {
    let videoEl = document.getElementById("videoElement");
    if (!videoEl) return;

    let videoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
    if (!videoUrl) return;

    videoEl.src = videoUrl;
    videoEl.currentTime = 0;
    videoEl.play().catch(err => console.error("Autoplay issue:", err));
}