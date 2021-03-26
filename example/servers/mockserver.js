// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const express = require("express");

const mockserver = ({ secure = false } = {}) => {
    // Create handlers
    const nonSecureRequestHandler = (req, res, next, cert = null) => {
        console.log("Request is received!");
        const responseStatus = req.responseStatus ? req.responseStatus : 200;

        res.set("server", "mockserver");
        res.status(responseStatus).json({
            certificate: cert
                ? `Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`
                : "Non-secure request!",
            request: {
                url: req.url,
                method: req.method,
                headers: req.headers,
                body: req.body,
            },
        });
    };
    const secureRequestHandler = (req, res, next) => {
        const cert = req.socket.getPeerCertificate();

        if (req.client.authorized) {
            console.log("Client Authorized!");
            nonSecureRequestHandler(req, res, next, cert);
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
    const requestHandler = secure
        ? secureRequestHandler
        : nonSecureRequestHandler;

    // Create router
    const router = express.Router();
    router.get("/get", requestHandler);
    router.post("/post", requestHandler);
    router.put("/put", requestHandler);
    router.patch("/patch", requestHandler);
    router.delete("/delete", requestHandler);

    // Create app
    const app = express();
    app.use(express.json());
    app.use("/", router);
    app.get("/", (req, res, next) => {
        res.sendStatus(200);
    });
    return app;
};

module.exports = mockserver;
