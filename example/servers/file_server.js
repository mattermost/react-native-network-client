// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const fs = require("fs");
const jwt = require('express-jwt');
const path = require('path');

const fileServer = function (directory) {
    // Set upload path
    let uploadPath = path.resolve(process.cwd(), directory);
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
    }
    console.log(`Upload path set to: ${uploadPath}`);

    // Create handlers
    const staticHandler = express.static(uploadPath, {index: false});
    const uploadHandler = (req, res, next) => {
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
    };

    // Create regular router
    const router = express.Router();
    router.use('/files', staticHandler);
    router.post('/files/:filename', uploadHandler);

    // Create protected router
    const protectedRouter = express.Router();
    protectedRouter.use(jwt({
        secret: 'token',
        algorithms: ['HS256'],
        credentialsRequired: false,
        getToken: function (req) {
            if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
                return req.headers.authorization.split(' ')[1];
            } else if (req.query && req.query.token) {
                return req.query.token;
            } else if (req.cookies && req.cookies.token) {
                return req.cookies.token;
            }
            return null;
        }
    }));
    protectedRouter.use('/files', staticHandler);
    protectedRouter.post('/files/:filename', uploadHandler);

    // Create app
    const app = express();
    app.use(compression());
    app.use(cookieParser());
    app.use(cors());
    app.use('/api', router);
    app.use('/protected', protectedRouter);
    app.use('/', function (req, res, next) {
        res.sendStatus(200);
    });
    return app;
};

module.exports = fileServer;
