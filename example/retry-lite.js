const http = require("http");

var attempts = 0;
var prevAttemptTime = Date.now();

console.log("Starting retry server...");
const requestListener = function (req, res) {
    attempts += 1;
    const attemptTime = Date.now();
    const diff = (attemptTime - prevAttemptTime) / 1000;
    prevAttemptTime = attemptTime;
    var resp = 418;
    if (attempts > 10) resp = 200;
    res.writeHead(resp);
    res.end();
    console.log(`Attempt #${attempts} Diff: ${diff} Resp: ${resp}`);
};

const server = http.createServer(requestListener);
server.listen(8000);
