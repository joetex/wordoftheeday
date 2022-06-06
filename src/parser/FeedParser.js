
let Parser = require('rss-parser');
let parser = new Parser();
const axios = require('axios');

const { createReadStream, createWriteStream } = require("fs");
const fs = require('fs');
const path = require('path');
const { createGzip } = require("zlib");

const credutil = require('./CredUtil');

const S3Upload = require('./S3Upload');



class FeedParser {

    constructor(configJSON) {
        if (!configJSON && !this.config.rssJSONPath)
            throw new Error("Invalid Configuration file");

        this.config = configJSON;
        this.urls = [];
        this.feeds = [];

        this.s3 = new S3Upload(credutil());
    }

    async processFeeds() {
        const jsonPath = path.join(process.cwd(), 'src', this.config.rssJSONPath);
        const badurlsPath = path.join(process.cwd(), 'src', this.config.badURLPath);
        const goodurlsPath = path.join(process.cwd(), 'src', this.config.goodURLPath);
        const feedPath = path.join(process.cwd(), 'src', this.config.feedSavePath);
        let jsonStr = fs.readFileSync(jsonPath);
        this.rssFeeds = JSON.parse(jsonStr);
        console.log(">>> Loading", this.rssFeeds.length, 'RSS feeds');

        let badURLs = [];
        let goodURLs = [];
        for (var i = 0; i < this.rssFeeds.length; i++) {
            let rss = this.rssFeeds[i];
            let url = rss.url;

            if (!url || url.length == 0) {
                badURLs.push(rss);
                continue;
            }

            try {
                let feed = await this.download(url);
                rss.feed = feed;
                this.feeds.push(feed);
                goodURLs.push(rss);
            }
            catch (e) {
                console.error(e);
                badURLs.push(rss);
            }

        }

        for (i = 0; i < this.feeds.length; i++) {
            let feed = this.feeds[i];


        }

        fs.writeFileSync(feedPath, JSON.stringify(this.rssFeeds));

        await this.compressFile(feedPath);

        var buffer = fs.readFileSync(feedPath);
        var multiPartParams = {
            Bucket: 'wotd-public',
            Key: 'topstories.json',
            ACL: 'public-read',
            ContentType: 'application/json',
            ContentEncoding: 'gzip'
        };

        this.s3.upload(multiPartParams, buffer);

        console.log("Bad URL count:", badURLs.length);
        fs.writeFileSync(badurlsPath, JSON.stringify(badURLs));
        fs.writeFileSync(goodurlsPath, JSON.stringify(goodURLs));

        this.rssFeeds = goodURLs;
    }


    compressFile = (filePath) => {

        return new Promise((rs, rj) => {
            try {
                const stream = createReadStream(filePath);
                stream
                    .pipe(createGzip())
                    .pipe(createWriteStream(`${filePath}.gz`))
                    .on("finish", () => {
                        console.log(`Successfully compressed the file at ${filePath}`);
                        rs(true);
                    })
                    .on("error", (e) => {
                        console.error(e);
                        rs(false);
                    });
            }
            catch (e) {
                console.error(e);
                rs(false);
            }

        })

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
            }
            catch (e) {
                console.error(e);
                return null;
            }
        })

    }

    async parse(rss) {

    }


}

module.exports = FeedParser;