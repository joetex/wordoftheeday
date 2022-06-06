
const FeedParser = require('./FeedParser');


const defaultConfigJSON = {
    "interval": 180000,
    "rssJSONPath": "./config/rss.json"
}

class FeedWorker {

    constructor(configJSON, feedList) {
        this.config = configJSON || defaultConfig;
        this.feeds = feedList || [];
        this.parser = new FeedParser(this.config);
    }


    start() {

        this.doWork();
        // setInterval(() => { this.doWork() }, this.config.interval || 60000);
    }

    async doWork() {

        this.parser.processFeeds();
    }


}

module.exports = FeedWorker;