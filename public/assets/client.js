var marquees = {};
var feedmanager = new FeedManager();

function createMarqueeByTag(marqueeId, tag, options) {
    let marquee = new Marquee(marqueeId, options || { speed: 80, direction: -1, paddingSpace: 100 });

    let feedItems = feedmanager.getFeedsByTag(tag);
    marquee.loadItems(feedItems);

    setInterval(() => {
        let newItems = feedmanager.getFeedsByTag(tag);
        marquee.reloadItems(newItems);
    }, 180000)

    marquees[marqueeId] = marquee;
    return marquee;
}

async function loadTickers() {
    let breakingURL = 'https://cdn.wordoftheeday.com/file/wotd-public/feeds/topstories.json';
    await feedmanager.download(breakingURL, 600000);

    createMarqueeByTag('breaking-news', 'Top Stories').start();
}


document.addEventListener("DOMContentLoaded", function () {
    loadTickers();
});