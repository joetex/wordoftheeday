


const express = require('express')
const app = express()
const port = 9090
const path = require('path');

const config = require('./config/config.json');
const FeedWorker = require('./parser/FeedWorker');
const fw = new FeedWorker(config);

const wellknownPath = path.join(__dirname, '../public/.well-known');
const assetsPath = path.join(__dirname, '../public/assets');

console.log("wellknownPath = ", wellknownPath);
app.use('/.well-known', express.static(wellknownPath, { dotfiles: 'allow' }));

app.use('/assets', express.static(assetsPath));


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public', '/index.html'));
});


app.get('/topstories', function (req, res) {
    res.header("Content-Type", 'application/json');
    res.sendFile(path.join(__dirname, 'output', 'feedSave.json'));
})
// app.get('/', (req, res) => {
//     res.send(`<!DOCTYPE html>
//         <html>
//             <head>
//                 <script async src="https://www.googletagmanager.com/gtag/js?id=UA-39173915-1"></script>
//                 <script>
//                 window.dataLayer = window.dataLayer || [];
//                 function gtag(){dataLayer.push(arguments);}
//                 gtag('js', new Date());gtag('config', 'UA-39173915-1');
//                 </script>
//                 <meta charset="UTF-8" />
//                 <meta name="viewport" content="width=device-width, initial-scale=1" />
//                 <meta name="description" content="Read live news as it streams through your screen" />
//                 <meta name="author" content="Word Of Thee Day" />
//                 <title>Word Of Thee Day</title>
//                 <link rel="preconnect" href="https://fonts.googleapis.com">
//                 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
//                 <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;500;700&display=swap" rel="stylesheet">
//                 <script async src="https://www.googletagmanager.com/gtag/js?id=G-HC09PY1QY2"></script>
//                 <script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-HC09PY1QY2');</script>
//             </head>
//             <body>
//                 <div id="root"></div>
//             </body>
//         </html>
//     `)
// })


app.listen(port, () => {
    console.log(`WordOfTheeDay.com listening on port ${port}`)

    fw.start();
})