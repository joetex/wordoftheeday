var marquees = {};
var feedmanager = new FeedManager();

function createMarqueeByTag(marqueeId, tag, options) {
    let marquee = new Marquee(marqueeId, options || { speed: 100, direction: -1, paddingSpace: 200 });

    let feedItems = feedmanager.getFeedsByTag(tag);
    marquee.loadItems(feedItems);

    marquees[marqueeId] = marquee;
    return marquee;
}

async function loadTickers() {
    let breakingURL = 'https://wotd-public.s3.us-west-000.backblazeb2.com/feeds/topstories.json';
    await feedmanager.download(breakingURL, 600000);

    createMarqueeByTag('breaking-news', 'Top Stories').start();
}


document.addEventListener("DOMContentLoaded", function () {
    loadTickers();
});