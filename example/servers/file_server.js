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
const TOKEN_KEY = process.env.FILE_SERVER_TOKEN_KEY || 'token';

const fileServer = function (directory) {
    // Set upload path
    let uploadPath = path.resolve(process.cwd(), directory);
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
    }
    console.log(`Upload path set to: ${uploadPath}`);

    // Token generator
    const generateToken = (id) => {
        return jwt.sign({id}, AUTH_SECRET, {algorithm: AUTH_ALGORITHM});
    }

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
            console.log(`Request headers: ${JSON.stringify(req.headers)}`);
            console.log(`Request query: ${JSON.stringify(req.query)}`);
            console.log(`Request cookies: ${JSON.stringify(req.cookies)}`);

            // Ignore token, will return a 401 (unauthorized)
            if (req.query && req.query.ignoreToken === 'true') {
                console.log(`Ignore token: ${req.query.ignoreToken}`);
                return null;
            }

            // Get token from headers, query string, or cookies
            let token;
            if (req.headers.authorization
                && req.headers.authorization.split(' ')[0] === 'Bearer'
                && !(req.query && req.query.ignoreHeaderToken === 'true')) {
                token = req.headers.authorization.split(' ')[1];
                console.log(`Get token from headers: ${token}`);
            } else if (req.query && req.query.token
                && !(req.query && req.query.ignoreQueryToken === 'true')) {
                token = req.query.token;
                console.log(`Get token from query string: ${token}`);
            } else if (req.cookies && req.cookies.token
                && !(req.query && req.query.ignoreCookieToken === 'true')) {
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
    app.get('/login/:id', function (req, res, next) {
        const token = generateToken(req.params.id);
        console.log(`New token: ${token}`);
        res.cookie(TOKEN_KEY, token)
            .set(TOKEN_KEY, token)
            .status(200)
            .send({
                id: req.params.id,
                token,
            });
    });

    // Expire cookie
    app.get('/cookie/:cookieName/value/:cookieValue/expire', function (req, res, next) {
        const cookieName = req.params.cookieName;
        const cookieValue = req.params.cookieValue;
        console.log(`Expire ${cookieName} cookie: ${cookieValue}`);
        res.set('Set-Cookie', `${cookieName}=${cookieValue}; Max-Age=0; Path=/`)
            .status(200)
            .send({
                expired: 'true',
                token,
            });
    });
    return app;
};

module.exports = fileServer;
