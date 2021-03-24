// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const express = require("express");

const secureServer = () => {
    // Create handlers
    const requestHandler = (req, res, next) => {
        const responseStatus = req.responseStatus ? req.responseStatus : 200;

        res.type("application/json");
        res.set("server", "secure server");
        res.status(responseStatus).send({
            request: {
                url: req.url,
                method: req.method,
                headers: req.headers,
                body: JSON.parse(req.body),
            },
        });
    };
    const authHandler = (req, res, next) => {
        const cert = req.socket.getPeerCertificate();

        if (req.client.authorized) {
            res.send(
                `Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`
            );
        } else if (cert.subject) {
            res.status(403).send(
                `Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`
            );
        } else {
            res.status(401).send(
                `Sorry, but you need to provide a client certificate to continue.`
            );
        }
    };

    // Create router
    const router = express.Router();
    router.use(authHandler);
    router.get("/get", requestHandler);
    router.post("/post", requestHandler);
    router.put("/put", requestHandler);
    router.patch("/patch", requestHandler);
    router.delete("/delete", requestHandler);

    // Create app
    const app = express();
    app.use("/", router);
    app.get("/", (req, res, next) => {
        res.sendStatus(200);
    });
    return app;
};

module.exports = secureServer;
