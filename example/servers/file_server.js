// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const jwtMiddleware = require("express-jwt");
const path = require("path");

const AUTH_SECRET = process.env.FILE_SERVER_AUTH_SECRET || "secret";
const AUTH_ALGORITHM = process.env.FILE_SERVER_AUTH_ALGORITHM || "HS256";
const TOKEN_KEY = process.env.FILE_SERVER_TOKEN_KEY || "token";

const getDefaultToken = (req) => {
    console.log("Get default token");

    // By default, attempt to get token value in this sequence
    // 1. headers
    // 2. query
    // 3. cookies
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
        token = req.headers.authorization.split(" ")[1];
        console.log(`Get token from headers: ${token}`);
    } else if (req.query && req.query.token) {
        token = req.query.token;
        console.log(`Get token from query: ${token}`);
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log(`Get token from cookies: ${token}`);
    } else {
        // Token not found, will return a 401 (unauthorized)
        token = null;
        console.log(`Token not found: ${token}`);
    }
    return token;
};

const getTokenBySource = (req) => {
    const tokenSource = req.query.tokenSource;
    console.log(`Get token by source: ${tokenSource}`);

    let token;
    switch (tokenSource) {
        case "headers":
            token = req.headers.authorization.split(" ")[1];
            console.log(`Get token from headers: ${token}`);
            break;
        case "query":
            token = req.query.token;
            console.log(`Get token from query: ${token}`);
            break;
        case "cookies":
            token = req.cookies.token;
            console.log(`Get token from cookies: ${token}`);
            break;
        default:
            // Token not found, will return a 401 (unauthorized)
            token = null;
            console.log(`Token not found: ${token}`);
    }
    return token;
};

const fileServer = ({ directory = "", secure = false } = {}) => {
    // Set upload path
    let uploadPath = path.resolve(process.cwd(), directory);
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
    }
    console.log(`Upload path set to: ${uploadPath}`);

    // Token generator
    const generateToken = (id) => {
        return jwt.sign({ id }, AUTH_SECRET, { algorithm: AUTH_ALGORITHM });
    };

    // Create handlers
    const secureRequestHandler = (
        req,
        res,
        next,
        requestHandler,
        { isStatic = false } = {}
    ) => {
        const cert = req.socket.getPeerCertificate();

        if (req.client.authorized) {
            console.log("Client Authorized!");
            if (isStatic) {
                requestHandler();
            } else {
                requestHandler(req, res, next, cert);
            }
        } else if (cert.subject) {
            console.log("Invalid client issuer - 403 Forbidden Error");
            res.status(403).send(
                `Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`
            );
        } else {
            console.log("Invalid client certificate - 401 Unauthorized Error");
            res.status(401).send(
                "Sorry, but you need to provide a client certificate to continue."
            );
        }
    };
    const nonSecureStaticHandler = express.static(uploadPath, { index: false });
    const secureStaticHandler = (req, res, next) => {
        secureRequestHandler(req, res, next, nonSecureStaticHandler, {
            isStatic: true,
        });
    };
    const nonSecureStreamUploadHandler = (req, res, next, cert = null) => {
        const filename = req.params.filename;
        const filePath = `${uploadPath}/${filename}`;
        req.pipe(
            fs
                .createWriteStream(filePath)
                .on("pipe", () => {
                    console.log("Successful pipe stream!");
                })
                .on("unpipe", () => {
                    console.log("Successful unpipe stream!");
                })
                .on("error", (error) => {
                    console.log(error);
                })
        );
        req.on("end", (end) => {
            console.log(`Finished! Uploaded to: ${filePath}`);
            res.set("server", "file-server");
            res.status(200).json({
                certificate: cert
                    ? `Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`
                    : "Non-secure request!",
                file: filename,
            });
        });
    };
    const secureStreamUploadHandler = (req, res, next) => {
        secureRequestHandler(req, res, next, nonSecureStreamUploadHandler);
    };
    const nonSecureMultipartUploadHandler = (req, res, next, cert = null) => {
        res.set("server", "file-server");

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send("No files were uploaded.");
        }

        console.log("Attempt to upload files...", Object.values(req.files));
        const filenames = [];

        try {
            Object.values(req.files).map((file) => {
                const filename = file.name;
                const filePath = `${uploadPath}/${filename}`;
                filenames.push(filename);
                console.log(`Uploading file: ${filename}`);

                // Move to file path
                file.mv(filePath, (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                    console.log(`Finished! Uploaded to: ${filePath}`);
                });
            });
        } catch (e) {
            console.log("Error", e);
        }

        console.log("Finished uploading files!", filenames);
        res.status(200).json({
            certificate: cert
                ? `Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`
                : "Non-secure request!",
            files: filenames,
        });
    };
    const secureMultipartUploadHandler = (req, res, next) => {
        secureRequestHandler(req, res, next, nonSecureMultipartUploadHandler);
    };
    const authHandler = jwtMiddleware({
        secret: AUTH_SECRET,
        algorithms: [AUTH_ALGORITHM],
        credentialsRequired: true,
        getToken: (req) => {
            console.log(`Request headers: ${JSON.stringify(req.headers)}`);
            console.log(`Request query: ${JSON.stringify(req.query)}`);
            console.log(`Request cookies: ${JSON.stringify(req.cookies)}`);

            // Ignore token, will return a 401 (unauthorized)
            if (req.query && req.query.ignoreToken === "true") {
                console.log(`Ignore token: ${req.query.ignoreToken}`);
                return null;
            }

            // Return token by source, otherwise return default token
            if (req.query && req.query.tokenSource) {
                return getTokenBySource(req);
            }
            return getDefaultToken(req);
        },
    });
    const authErrorHandler = (err, req, res, next) => {
        if (err.name === "UnauthorizedError") {
            console.log("Invalid token - 401 Unauthorized Error");
            res.status(401).send("invalid token");
        }
    };
    const staticHandler = secure ? secureStaticHandler : nonSecureStaticHandler;
    const streamUploadHandler = secure
        ? secureStreamUploadHandler
        : nonSecureStreamUploadHandler;
    const multipartUploadHandler = secure
        ? secureMultipartUploadHandler
        : nonSecureMultipartUploadHandler;

    // Create regular router
    const router = express.Router();
    router.use("/files", staticHandler);
    router.all("/files/stream/:filename", streamUploadHandler);
    router.all("/files/multipart", multipartUploadHandler);

    // Create protected router
    const protectedRouter = express.Router();
    protectedRouter.use(authHandler);
    protectedRouter.use("/files", staticHandler);
    protectedRouter.all("/files/stream/:filename", streamUploadHandler);
    protectedRouter.all("/files/multipart", multipartUploadHandler);

    // Create app
    const app = express();
    app.use(compression());
    app.use(cookieParser());
    app.use(cors());
    app.use(fileUpload());
    app.use("/api", router);
    app.use("/protected/api", protectedRouter);
    app.use(authErrorHandler);
    app.get("/", (req, res, next) => {
        res.sendStatus(200);
    });

    // Generate token
    const nonSecureGenerateTokenHandler = (req, res, next) => {
        const token = generateToken(req.params.id);
        console.log(`New token: ${token}`);
        res.cookie(TOKEN_KEY, token).set(TOKEN_KEY, token).status(200).send({
            id: req.params.id,
            token,
        });
    };
    const secureGenerateTokenHandler = (req, res, next) => {
        secureRequestHandler(req, res, next, nonSecureGenerateTokenHandler);
    };
    const generateTokenHandler = secure
        ? secureGenerateTokenHandler
        : nonSecureGenerateTokenHandler;
    app.get("/login/:id", generateTokenHandler);

    // Expire cookie
    const nonSecureExpireCookieHandler = (req, res, next) => {
        const cookieName = req.params.cookieName;
        const cookieValue = req.params.cookieValue;
        console.log(`Expire ${cookieName} cookie: ${cookieValue}`);
        res.set("Set-Cookie", `${cookieName}=${cookieValue}; Max-Age=0; Path=/`)
            .status(200)
            .send({
                expired: "true",
                token,
            });
    };
    const secureExpireCookieHandler = (req, res, next) => {
        secureRequestHandler(req, res, next, nonSecureExpireCookieHandler);
    };
    const expireCookieHandler = secure
        ? secureExpireCookieHandler
        : nonSecureExpireCookieHandler;
    app.get(
        "/cookie/:cookieName/value/:cookieValue/expire",
        expireCookieHandler
    );

    return app;
};

module.exports = fileServer;
