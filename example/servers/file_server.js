// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const fs = require("fs");
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('express-jwt');
const path = require('path');

const AUTH_SECRET = process.env.FILE_SERVER_AUTH_SECRET || 'secret';
const AUTH_ALGORITHM = process.env.FILE_SERVER_AUTH_ALGORITHM || 'HS256';

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
            res.status(200).send({
                status: "OK",
            });
        });
    };
    const authHandler = jwtMiddleware({
        secret: AUTH_SECRET,
        algorithms: [AUTH_ALGORITHM],
        credentialsRequired: true,
        getToken: function (req) {
            // Ignore token, will return a 401 (unauthorized)
            if (req.query && req.query.ignoreToken === 'true') {
                console.log(`Ignore token: ${req.query.ignoreToken}`);
                return null;
            }

            // Get token from headers, query string, or cookies
            let token;
            if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
                token = req.headers.authorization.split(' ')[1];
                console.log(`Get token from headers: ${token}`);
            } else if (req.query && req.query.token) {
                token = req.query.token;
                console.log(`Get token from query string: ${token}`);
            } else if (req.cookies && req.cookies.token) {
                token = req.cookies.token;
                console.log(`Get token from cookies: ${token}`);
            } else {
                // Token not found, will return a 401 (unauthorized)
                token = null;
                console.log(`Token not found: ${token}`);
            }
            return token;
        }
    });

    // Create regular router
    const router = express.Router();
    router.use('/files', staticHandler);
    router.post('/files/:filename', uploadHandler);

    // Create protected router
    const protectedRouter = express.Router();
    protectedRouter.use(authHandler);
    protectedRouter.use('/files', staticHandler);
    protectedRouter.post('/files/:filename', uploadHandler);

    // Create app
    const app = express();
    app.use(compression());
    app.use(cookieParser());
    app.use(cors());
    app.use('/api', router);
    app.use('/protected/api', protectedRouter);
    app.get('/', function (req, res, next) {
        res.sendStatus(200);
    });

    // Generate token
    app.post('/login/:id', function (req, res, next) {
        const token = jwt.sign(
            { 
                id: req.params.id,
            },
            AUTH_SECRET,
            {
                algorithm: AUTH_ALGORITHM,
            }
        );
        res.status(200).send({
            id: req.params.id,
            token,
        });
    });
    return app;
};

module.exports = fileServer;
