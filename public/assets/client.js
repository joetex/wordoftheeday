var marquees = {};
var feedmanager = new FeedManager();

function createMarquee(marqueeId, options) {
    let marquee = new Marquee(marqueeId, options || { speed: 100, direction: -1, paddingSpace: 200 });

    let marqueeElem = document.getElementById(marqueeId);
    marqueeElem.addEventListener('click', function (e) {
        // marquee.toggleDirection();
        // marquee.togglePause();
    })

    marqueeElem.addEventListener('mousedown', function (e) {
        marquee.startDrag(e);
    })
    marqueeElem.addEventListener('mousemove', function (e) {
        marquee.drag(e);
    })

    marqueeElem.addEventListener('mouseup', function (e) {
        marquee.endDrag(e);
    })
    marqueeElem.addEventListener('mouseleave', function (e) {
        marquee.endDrag(e);
    })

    document.addEventListener('mouseup', function (e) {
        marquee.endDrag(e);
        // marquee.play();
    })
    document.addEventListener('mousemove', function (e) {
        marquee.drag(e);
        e.stopPropagation();
        e.preventDefault();
    })

    marqueeElem.addEventListener('mouseenter', function (e) {
        // marquee.pause();
    })
    marqueeElem.addEventListener('mouseleave', function (e) {

    })

    marquees[marqueeId] = marquee;

    return marquee;
}

function populateEmptyMarquee(marqueeId, feedItems) {

    let marquee = marquees[marqueeId];
    if (!marquee) {
        console.error("Invalid marquee id", marqueeId);
        return;
    }

    for (var z = 0; z < feedItems.length; z++) {
        marquee.createItem(feedItems[z]);
    }
}

async function loadTickers() {
    let breakingURL = 'https://wotd-public.s3.us-west-000.backblazeb2.com/feeds/topstories.json';
    await feedmanager.download(breakingURL);

    let breakingId = 'breaking-news';
    let breakingMarquee = createMarquee(breakingId);
    let breakingItems = feedmanager.getFeedsByTag('Top Stories');
    populateEmptyMarquee(breakingId, breakingItems);

    breakingMarquee.animLoop();
}


document.addEventListener("DOMContentLoaded", function () {
    loadTickers();
});