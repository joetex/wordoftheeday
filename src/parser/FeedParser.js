
let Parser = require('rss-parser');
let parser = new Parser();
const axios = require('axios');

const fs = require('fs');
const path = require('path');

class FeedParser {

    constructor(configJSON) {
        if (!configJSON && !this.config.rssJSONPath)
            throw new Error("Invalid Configuration file");

        this.config = configJSON;
        this.urls = [];
        this.feeds = [];
    }

    async processFeeds() {
        const jsonPath = path.join(process.cwd(), 'src', this.config.rssJSONPath);
        const badurlsPath = path.join(process.cwd(), 'src', this.config.badURLPath);
        const goodurlsPath = path.join(process.cwd(), 'src', this.config.goodURLPath);

        let jsonStr = fs.readFileSync(jsonPath);
        this.urls = JSON.parse(jsonStr);
        console.log(">>> Loading", this.urls.length, 'RSS feeds');

        let badURLs = [];
        let goodURLs = [];
        for (var i = 0; i < this.urls.length; i++) {
            let item = this.urls[i];
            let rssURL = item.rss;

            if (!rssURL || rssURL.length == 0) {
                badURLs.push(item);
                continue;
            }

            try {
                let feed = await this.download(rssURL);
                this.feeds.push(feed);
                goodURLs.push(item);
            }
            catch (e) {
                badURLs.push(item);
            }
        }

        console.log("Bad URL count:", badURLs.length);
        fs.writeFileSync(badurlsPath, JSON.stringify(badURLs));
        fs.writeFileSync(goodurlsPath, JSON.stringify(goodURLs));

        this.urls = goodURLs;
    }


    async download(url) {

        return new Promise((rs, rj) => {
            try {
                console.log("Downloading RSS from URL:", url);
                parser.parseURL(url, (err, feed) => {
                    if (err) {
                        rj(err);
                        return;
                    }

                    rs(feed);
                })
                return response;
            }
            catch (e) {
                //console.error(e);
                return null;
            }
        })

    }

    async parse(rss) {

    }


}

module.exports = FeedParser;