
class FeedManager {
    constructor() {

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
    //marqueeId: 'breaking-news'
    download = async (url, marqueeId) => {
        const response = await fetch(url);
        let rssFeeds = await response.json();
        console.log(rssFeeds);

        for (var i = 0; i < rssFeeds.length; i++) {
            let rssFeed = rssFeeds[i];

            if (!rssFeed.feed || !rssFeed.feed.items)
                continue;

            for (var j = 0; j < rssFeed.feed.items.length; j++) {
                let feedItem = rssFeed.feed.items[j];

                if (!this.isAllowed(feedItem)) {
                    continue;
                }

                if (feedItem.content.indexOf('Drudge') == -1 && feedItem.content.indexOf('drudge') == -1)
                    continue;

                feedItem.tags = rssFeed.tags;
                feedItem.owner = rssFeed.title;
                feedItem.srcURL = rssFeed.link;
                feedItem.srcRSS = rssFeed.url;
                feedItem.srcDomain = rssFeed.link.replace(/(https\:\/\/)|(http\:\/\/)/ig, '').split('/')[0];

                this.putFeed(feedItem);
            }
        }

        this.sortFeeds();

        return rssFeeds;
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

    //filter out feed items like advertisements or other useless junk (is it even possible?)
    isAllowed = (feedItem) => {

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

        this.feeds.sort((a, b) => {
            let aTime = new Date(a.isoDate).getTime();
            let bTime = new Date(b.isoDate).getTime();
            return bTime - aTime;
        })

        for (var tag in this.feedsByTag) {
            this.feedsByTag[tag].sort((a, b) => {
                let aTime = new Date(a.isoDate).getTime();
                let bTime = new Date(b.isoDate).getTime();
                return bTime - aTime;
            })
        }

        for (var owner in this.feedsByOwner) {
            this.feedsByOwner[owner].sort((a, b) => {
                let aTime = new Date(a.isoDate).getTime();
                let bTime = new Date(b.isoDate).getTime();
                return bTime - aTime;
            })
        }

    }
}