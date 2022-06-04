
const FeedParser = require('./FeedParser');
const axios = require('axios');

const defaultConfigJSON = {
    delay: 60000
}

class FeedWorker {

    constructor(configJSON, feedList) {
        this.config = configJSON || defaultConfig;
        this.feeds = feedList || [];
    }


    start() {

        setInterval(loop, config.delay || 60000);
    }

    loop() {

    }

    async download(url) {
        let response = await axios.get(url);
    }
}

module.exports = FeedWorker;