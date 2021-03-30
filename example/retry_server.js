// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const cors = require("cors");
const express = require("express");
const http = require("http");

const retryMap = new Map();

const delayResponse = (
    req,
    res,
    {
        clientID,
        clientAttempts,
        clientAttemptBeginTime,
        serverDelay,
        serverRetryLimit,
    }
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
        });
        res.sendStatus(418);
    } else {
        console.log(
            `Successful after attempt ${clientAttempts}! Removing client ${clientID}`
        );
        retryMap.delete(clientID);
        res.sendStatus(200);
    }
};

const retryServer = () => {
    // Create handlers
    const requestHandler = (req, res, next) => {
        const clientID = req.query.clientID;
        console.log("Client request received!");
        if (!retryMap.has(clientID)) {
            console.log(`Client ${clientID} attempt #1`);
            delayResponse(req, res, {
                clientID,
                clientAttempts: 1,
                clientAttemptBeginTime: Date.now(),
                serverDelay: req.query.serverDelay ? req.query.serverDelay : 0,
                serverRetryLimit: req.query.serverRetryLimit ? req.query.serverRetryLimit : 1,
            });
        } else {
            const retry = retryMap.get(clientID);
            const clientAttempts = retry.clientAttempts + 1;
            console.log(`Client ${clientID} attempt #${clientAttempts}`);
            delayResponse(req, res, {
                clientID,
                clientAttempts,
                clientAttemptBeginTime: retry.clientAttemptBeginTime,
                serverDelay: retry.serverDelay,
                serverRetryLimit: retry.serverRetryLimit,
            });
        }
    };

    // Create app
    const app = express();
    app.use(cors());
    app.all("/", requestHandler);
    return app;
};

console.log("Starting retry server...");
http.createServer(retryServer()).listen(8000);
