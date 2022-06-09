const minute = 60000;
const hour = minute * 60;
const day = hour * 24;

class FeedManager {
    constructor() {

        this.tags = [];
        this.tagMap = {};

        //main list of feed items
        this.feeds = [];

        this.feedsIteration = {};

        this.feedsActive = {};

        //references main list for feed item
        this.feedsByTag = {};

        //references main list for feed item
        this.feedsByOwner = {};

        this.unfocusStartTime = 0;

        document.addEventListener('visibilitychange', this.checkTabFocused);

    }

    checkTabFocused = () => {
        if (document.visibilityState === 'visible') {
            // this.play(true);
        } else {
            // this.pause(true);
        }
    }

    clearFeeds = () => {
        this.tags = [];
        this.tagMap = {};

        //main list of feed items
        this.feeds = [];

        this.feedsActive = {};

        //references main list for feed item
        this.feedsByTag = {};

        //references main list for feed item
        this.feedsByOwner = {};
    }


    //url: 'https://wotd-public.s3.us-west-000.backblazeb2.com/feeds/topstories.json'
    download = async (url, reloadInterval) => {
        const response = await fetch(url);
        let rssFeeds = await response.json();
        // console.log(rssFeeds);

        if (!(url in this.feedsIteration))
            this.feedsIteration[url] = 0;
        this.feedsIteration[url] = this.feedsIteration[url] + 1;

        for (var i = 0; i < rssFeeds.length; i++) {
            let rssFeed = rssFeeds[i];

            if (!rssFeed.feed || !rssFeed.feed.items)
                continue;

            for (var j = 0; j < rssFeed.feed.items.length; j++) {
                let feedItem = rssFeed.feed.items[j];

                if (!this.isAllowed(feedItem)) {
                    continue;
                }

                // if (feedItem.content.indexOf('Drudge') == -1 && feedItem.content.indexOf('drudge') == -1)
                //     continue;

                feedItem.tags = rssFeed.tags;
                feedItem.owner = rssFeed.title;
                feedItem.srcURL = rssFeed.link;
                feedItem.srcRSS = rssFeed.url;
                feedItem.srcDomain = rssFeed.link.replace(/(https\:\/\/)|(http\:\/\/)/ig, '').split('/')[0];
                feedItem.iteration = this.feedsIteration[url];
                this.putFeed(feedItem);
            }
        }

        this.sortFeeds();


        setTimeout(() => { this.download(url, reloadInterval) }, reloadInterval);
        return rssFeeds;
    }



    //filter out feed items like advertisements or other useless junk (is it even possible?)
    isAllowed = (feedItem) => {
        if (feedItem.link in this.feedsActive) {
            return false;
        }

        let pubDate = new Date(feedItem.isoDate || feedItem.pubDate).getTime();
        let now = (new Date()).getTime();


        if ((now - pubDate) > day * 2)
            return false;

        return true;
    }
    getFeedsByTag = (tag) => {
        return this.feedsByTag[tag];
    }

    getFeedsBySource = (source) => {
        return this.feedsByOwner[source];
    }

    putFeed = (feedItem) => {



        this.feeds.push(feedItem);
        this.feedsActive[feedItem.link] = true;

        for (var i = 0; i < feedItem.tags.length; i++) {
            let tag = feedItem.tags[i];

            if (!(tag in this.tagMap)) {
                this.tags.push(tag);
                this.tagMap[tag] = true;
            }

            if (!(tag in this.feedsByTag)) {
                this.feedsByTag[tag] = [];
            }

            this.feedsByTag[tag].push(feedItem);
        }

        let owner = feedItem.owner;
        if (!(owner in this.feedsByOwner)) {
            this.feedsByOwner[owner] = [];
        }
        this.feedsByOwner[owner].push(feedItem);
    }

    sortFeeds = () => {

        let now = (new Date()).getTime();


        this.feeds.sort((a, b) => {

            let aTime = new Date(a.isoDate || a.pubDate).getTime();
            let bTime = new Date(b.isoDate || b.pubDate).getTime();

            if (a.iteration > b.iteration) {
                if ((now - bTime) < (hour * 2))
                    return -1;
            }
            else if (a.iteration < b.iteration) {
                if ((now - aTime) < (hour * 2))
                    return 1;
            }


            return aTime - bTime;
        })

        for (var tag in this.feedsByTag) {
            this.feedsByTag[tag].sort((a, b) => {
                let aTime = new Date(a.isoDate || a.pubDate).getTime();
                let bTime = new Date(b.isoDate || b.pubDate).getTime();

                if (a.iteration > b.iteration) {
                    if ((now - bTime) < (hour * 2))
                        return -1;
                }
                else if (a.iteration < b.iteration) {
                    if ((now - aTime) < (hour * 2))
                        return 1;
                }
                return aTime - bTime;
            })
        }

        for (var owner in this.feedsByOwner) {
            this.feedsByOwner[owner].sort((a, b) => {
                let aTime = new Date(a.isoDate || a.pubDate).getTime();
                let bTime = new Date(b.isoDate || b.pubDate).getTime();

                if (a.iteration > b.iteration) {
                    if ((now - bTime) < (hour * 2))
                        return -1;
                }
                else if (a.iteration < b.iteration) {
                    if ((now - aTime) < (hour * 2))
                        return 1;
                }
                return aTime - bTime;
            })
        }

    }
}