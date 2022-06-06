

async function loadTickers() {

    const response = await fetch('https://wotd-public.s3.us-west-000.backblazeb2.com/feeds/topstories.json');
    let rssFeeds = await response.json();
    console.log(rssFeeds);

    let breakingNews = new Marquee('breaking-news', { speed: 100, direction: -1, paddingSpace: 200 });

    let news = [];
    for (var i = 0; i < rssFeeds.length; i++) {
        let rssFeed = rssFeeds[i];

        if (!rssFeed.feed || !rssFeed.feed.items)
            continue;

        for (var j = 0; j < rssFeed.feed.items.length; j++) {
            let feedItem = rssFeed.feed.items[j];

            news.push(feedItem);
        }
    }

    news.sort((a, b) => {
        let aTime = new Date(a.isoDate).getTime();
        let bTime = new Date(b.isoDate).getTime();
        return bTime - aTime;
    })

    for (var z = 0; z < news.length; z++) {
        breakingNews.createItem(news[z]);
    }

    // breakingNews.createItem({ title: '7 things to know before the bell', link: 'https://www.reddit.com/r/jokes' });
    // breakingNews.createItem({ title: 'SoftBank and Toyota want driverless cars to change the world', link: 'https://www.reddit.com/r/houston' });
    // breakingNews.createItem({ title: 'Aston Martin falls 5% in its London IPO', link: 'https://www.reddit.com/r/austin' });
    // breakingNews.createItem({ title: 'Barnes & Noble stock soars 20% as it explores a sale', link: 'https://www.reddit.com/r/funny' });

    breakingNews.animLoop();

    let breakingNewsElem = document.getElementById('breaking-news');
    breakingNewsElem.addEventListener('click', function (e) {
        breakingNews.togglePause();
    })

    breakingNewsElem.addEventListener('mouseenter', function (e) {

        breakingNews.setDirection(1);
    })

    breakingNewsElem.addEventListener('mouseleave', function (e) {

        breakingNews.setDirection(-1);
    })

}


document.addEventListener("DOMContentLoaded", function () {
    loadTickers();
});