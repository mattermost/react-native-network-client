// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const compression = require('compression');
const express = require('express');
const fs = require("fs");
const path = require('path');

const fileServer = function (directory) {
    // Set upload path
    let uploadPath = path.resolve(process.cwd(), directory);
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
    }
    console.log(`Upload path set to: ${uploadPath}`);

    // Create router
    const router = express.Router();
    router.post('/upload/:filename', function (req, res, next) {
        const filePath = `${uploadPath}/${req.params.filename}`;
        req.pipe(fs.createWriteStream(filePath)
            .on('pipe', function () {
                console.log('Successful pipe stream!');
            })
            .on('unpipe', function () {
                console.log('Successful unpipe stream!');
            })
            .on('error', function (error) {
                console.log(error);
            }));
        req.on('end', function (end) {
            console.log(`Finished! Uploaded to: ${filePath}`);
            res.send('{"status": "OK"}');
        });
    });

    // Create app
    const app = express();
    app.use(compression());
    app.use('/api', router);
    app.use('/static', express.static(uploadPath, {index: false}));
    app.use('/', function (req, res, next) {
        res.sendStatus(200);
    })
    return app;
};

module.exports = fileServer;
