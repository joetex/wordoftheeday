

async function loadTickers() {

    const response = await fetch('https://cdn.wordoftheeday.com/topstories.json');
    console.log(response);

    let breakingNews = new Marquee('breaking-news', { speed: 100, direction: -1, paddingSpace: 200 });

    breakingNews.createItem({ title: '7 things to know before the bell', link: 'https://www.reddit.com/r/jokes' });
    breakingNews.createItem({ title: 'SoftBank and Toyota want driverless cars to change the world', link: 'https://www.reddit.com/r/houston' });
    breakingNews.createItem({ title: 'Aston Martin falls 5% in its London IPO', link: 'https://www.reddit.com/r/austin' });
    breakingNews.createItem({ title: 'Barnes & Noble stock soars 20% as it explores a sale', link: 'https://www.reddit.com/r/funny' });

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