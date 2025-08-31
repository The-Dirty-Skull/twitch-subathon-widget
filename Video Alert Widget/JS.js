let cfg = {
    firstRangeGiftedVideos: [],
    secondRangeGiftedVideos: [],
    thirdRangeGiftedVideos: [],
    fourthRangeGiftedVideos: [],
    sixMonthSubVideos: []
};

window.addEventListener('onWidgetLoad', function (obj) {
    let fieldData = obj["detail"]["fieldData"];
    console.log("Field Data:", fieldData);
    cfg.firstRangeGiftedVideos = fieldData.firstRangeGiftedVideos || [];
    cfg.secondRangeGiftedVideos = fieldData.secondRangeGiftedVideos || [];
    cfg.thirdRangeGiftedVideos = fieldData.thirdRangeGiftedVideos || [];
    cfg.fourthRangeGiftedVideos = fieldData.fourthRangeGiftedVideos || [];
    cfg.sixMonthSubVideos = fieldData.sixMonthSubVideos || [];
});

window.addEventListener('onEventReceived', function (obj) {
    if (!obj.detail || !obj.detail.event) return;
    let event = obj.detail.event;
    let listener = obj.detail.listener;

    if (listener.includes("subscriber") && event.bulkGifted) {
        if (event.amount >= 200) {
            playVideo(cfg.fourthRangeGiftedVideos);
        }
        else if (event.amount >= 100) {
            playVideo(cfg.thirdRangeGiftedVideos);
        }
        else if (event.amount >= 50) {
            playVideo(cfg.secondRangeGiftedVideos);
        }
        else if (event.amount >= 5) {
            playVideo(cfg.firstRangeGiftedVideos);
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

    videoEl.classList.add('show');
    videoEl.src = videoUrl;
    videoEl.currentTime = 0;
    videoEl.play().catch(err => console.error("Autoplay issue:", err));

    videoEl.onended = null;
    videoEl.onended = function() {
        videoEl.classList.remove('show');
    };
}