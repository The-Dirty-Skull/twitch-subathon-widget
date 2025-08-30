let cfg = {
    upTo10GiftedVideos: [],
    upTo25GiftedVideos: [],
    upTo50GiftedVideos: [],
    hundredGiftedVideos: [],
    sixMonthSubVideos: []
};

window.addEventListener('onWidgetLoad', function (obj) {
    let fieldData = obj["detail"]["fieldData"];
    console.log("Field Data:", fieldData);
    cfg.upTo10GiftedVideos = fieldData.upTo10GiftedVideos || [];
    cfg.upTo25GiftedVideos = fieldData.upTo25GiftedVideos || [];
    cfg.upTo50GiftedVideos = fieldData.upTo50GiftedVideos || [];
    cfg.hundredGiftedVideos = fieldData.hundredGiftedVideos || [];
    cfg.sixMonthSubVideos = fieldData.sixMonthSubVideos || [];
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
            playVideo(cfg.upTo50GiftedVideos);
        }
        else if (event.amount >= 25) {
            playVideo(cfg.upTo25GiftedVideos);
        }
        else if (event.amount >= 10) {
            playVideo(cfg.upTo10GiftedVideos);
        }
    }
    else if (listener.includes("subscriber") && !event.bulkGifted && !event.gifted && event.amount >= 6) {
        playVideo(cfg.sixMonthSubVideos);
    }


});

function playVideo(videoUrls) {
    console.log("Playing video from list:", videoUrls);
    if (!videoUrls || videoUrls.length === 0) return;
    let videoEl = document.getElementById("videoElement");
    if (!videoEl) return;

    let videoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
    if (!videoUrl) return;

    videoEl.src = videoUrl;
    videoEl.currentTime = 0;
    videoEl.play().catch(err => console.error("Autoplay issue:", err));
}