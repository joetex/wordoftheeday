
const NODE_ENV = process.env.NODE_ENV;

module.exports = () => {
    console.log("NODE_ENV: ", NODE_ENV);

    if (NODE_ENV == 'prod' || NODE_ENV == 'production') {
        console.log("LOADING PRODUCTION CREDENTIALS");
        return require('../credentials/production.json');
    }

    if (NODE_ENV == 'mobile') {
        console.log("LOADING MOBILE CREDENTIALS");
        return require('../credentials/mobile.json');
    }
    console.log("LOADING LOCALHOST CREDENTIALS");
    return require('../credentials/localhost.json');
}