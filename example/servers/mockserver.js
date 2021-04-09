// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const express = require("express");

const retryMap = new Map();

const mockserver = ({ secure = false } = {}) => {
    const delayResponse = (
        req,
        res,
        next,
        {
            clientID,
            clientAttempts,
            clientAttemptBeginTime,
            serverDelay,
            serverRetryLimit,
            failureResponseStatus,
        },
        requestHandler
    ) => {
        console.log(
            `Delay response by: ${serverDelay} millis with retry limit: ${serverRetryLimit}`
        );
        Atomics.wait(
            new Int32Array(new SharedArrayBuffer(4)),
            0,
            0,
            serverDelay
        );

        if (clientAttempts < serverRetryLimit) {
            const clientAttemptEndTime = Date.now();
            const clientAttemptTimeDiff =
                (clientAttemptEndTime - clientAttemptBeginTime) / 1000;
            console.log(
                `Client ${clientID} attempt #${clientAttempts} diff: ${clientAttemptTimeDiff}`
            );
            retryMap.set(clientID, {
                serverDelay,
                serverRetryLimit,
                clientAttempts,
                clientAttemptBeginTime,
                clientAttemptEndTime,
                clientAttemptTimeDiff,
                failureResponseStatus,
            });
            return res.sendStatus(failureResponseStatus);
        }

        console.log(
            `Successful after attempt ${clientAttempts}! Reset client ${clientID}!`
        );
        retryMap.delete(clientID);
        requestHandler(req, res, next);
    };
    const retryDelayResponse = (req, res, next, requestHandler) => {
        console.log("Client request received!");
        const clientID = req.params.clientID;
        if (!retryMap.has(clientID)) {
            console.log(`Client ${clientID} attempt #1`);
            const failureResponseStatus = req.headers.failureResponseStatus
                ? req.headers.failureResponseStatus
                : 408;
            delayResponse(
                req,
                res,
                next,
                {
                    clientID,
                    clientAttempts: 1,
                    clientAttemptBeginTime: Date.now(),
                    serverDelay: req.params.serverDelay,
                    serverRetryLimit: req.params.serverRetryLimit,
                    failureResponseStatus,
                },
                requestHandler
            );
        } else {
            const retry = retryMap.get(clientID);
            const clientAttempts = retry.clientAttempts + 1;
            console.log(`Client ${clientID} attempt #${clientAttempts}`);
            delayResponse(
                req,
                res,
                next,
                {
                    clientID,
                    clientAttempts,
                    clientAttemptBeginTime: retry.clientAttemptBeginTime,
                    serverDelay: retry.serverDelay,
                    serverRetryLimit: retry.serverRetryLimit,
                    failureResponseStatus: retry.failureResponseStatus,
                },
                requestHandler
            );
        }
    };

    // Create handlers
    const secureRequestHandler = (req, res, next, requestHandler) => {
        const cert = req.socket.getPeerCertificate();

        if (req.client.authorized) {
            console.log("Client Authorized!");
            requestHandler(req, res, next, cert);
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
    const nonSecureMockRequestHandler = (req, res, next, cert = null) => {
        console.log("Request is received!");
        const responseStatus = req.headers.responseStatus
            ? req.headers.responseStatus
            : 200;

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
    const secureMockRequestHandler = (req, res, next) => {
        secureRequestHandler(req, res, next, nonSecureMockRequestHandler);
    };
    const nonSecureRetryMockRequestHandler = (req, res, next) => {
        retryDelayResponse(req, res, next, nonSecureMockRequestHandler);
    };
    const secureRetryMockRequestHandler = (req, res, next) => {
        retryDelayResponse(req, res, next, secureMockRequestHandler);
    };
    const nonSecureRetryResetHandler = (req, res, next) => {
        const clientID = req.params.clientID;
        if (clientID) {
            console.log(`Reset client ${clientID}!`);
            retryMap.delete(clientID);
        } else {
            console.log("Reset all clients!");
            retryMap.clear();
        }
        res.sendStatus(200);
    };
    const secureRetryResetHandler = (req, res, next) => {
        secureRequestHandler(req, res, next, nonSecureRetryResetHandler);
    };
    const mockRequestHandler = secure
        ? secureMockRequestHandler
        : nonSecureMockRequestHandler;
    const retryMockRequestHandler = secure
        ? secureRetryMockRequestHandler
        : nonSecureRetryMockRequestHandler;
    const retryResetHandler = secure
        ? secureRetryResetHandler
        : nonSecureRetryResetHandler;

    // Create router
    const router = express.Router();
    router.get("/get", mockRequestHandler);
    router.get(
        "/get/retry/clientID/:clientID/serverDelay/:serverDelay/serverRetryLimit/:serverRetryLimit",
        retryMockRequestHandler
    );
    router.get("/get/retry/reset/clientID/:clientID", retryResetHandler);
    router.post("/post", mockRequestHandler);
    router.post(
        "/post/retry/clientID/:clientID/serverDelay/:serverDelay/serverRetryLimit/:serverRetryLimit",
        retryMockRequestHandler
    );
    router.post("/post/retry/reset/clientID/:clientID", retryResetHandler);
    router.put("/put", mockRequestHandler);
    router.put(
        "/put/retry/clientID/:clientID/serverDelay/:serverDelay/serverRetryLimit/:serverRetryLimit",
        retryMockRequestHandler
    );
    router.put("/put/retry/reset/clientID/:clientID", retryResetHandler);
    router.patch("/patch", mockRequestHandler);
    router.patch(
        "/patch/retry/clientID/:clientID/serverDelay/:serverDelay/serverRetryLimit/:serverRetryLimit",
        retryMockRequestHandler
    );
    router.patch("/patch/retry/reset/clientID/:clientID", retryResetHandler);
    router.delete("/delete", mockRequestHandler);
    router.delete(
        "/delete/retry/clientID/:clientID/serverDelay/:serverDelay/serverRetryLimit/:serverRetryLimit",
        retryMockRequestHandler
    );
    router.delete("/delete/retry/reset/clientID/:clientID", retryResetHandler);

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
