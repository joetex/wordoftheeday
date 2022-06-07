var marquees = {};
var feedmanager = new FeedManager();

function createMarquee(marqueeId, options) {
    let marquee = new Marquee(marqueeId, options || { speed: 1000, direction: -1, paddingSpace: 200 });

    let marqueeElem = document.getElementById(marqueeId);
    marqueeElem.addEventListener('click', function (e) {
        // marquee.toggleDirection();
        marquee.play();
    })

    let marqueeItems = marqueeElem.querySelectorAll('.marquee-item');
    for (var i = 0; i < marqueeItems.length; i++) {
        let item = marqueeItems[i];
        item.addEventListener('click', function (e) {

            return false;
        })
    }
    marqueeElem.addEventListener('mouseenter', function (e) {
        marquee.pause();
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