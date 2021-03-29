const http = require("http");

var attempts = 0;
var prevAttemptTime = Date.now();

console.log("Starting retry server...");
const requestListener = function (req, res) {
    attempts += 1;
    const attemptTime = Date.now();
    const diff = (attemptTime - prevAttemptTime) / 1000;
    prevAttemptTime = attemptTime;

    console.log(`Attempt #${attempts} Diff: ${diff}`);

    if (attempts < 5) res.writeHead(418);
    else res.writeHead(200);
    res.end();
};

const server = http.createServer(requestListener);
server.listen(8000);
