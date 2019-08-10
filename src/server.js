const express = require("express");
const bodyParser = require("body-parser");
const server = express();
var path = require("path");
var public = __dirname + "/app/public/";
const port = process.env.PORT || 9000;
const router = require("./app/routes/router");
const fs = require("fs");
const https = require("https");

server.use(express.static(path.join(__dirname, "app/public")));
server.enable("trust proxy");

server.get("/", function(req, res) {
    res.sendFile(path.join(public + "index.html"));
});

server.use(bodyParser.json({ limit: "200mb", extended: true }));
server.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));
router.setupRouter(server);

https
    .createServer(
        {
            key: fs.readFileSync("server.key"),
            cert: fs.readFileSync("server.cert")
        },
        server
    )
    .listen(port, () => {
        console.log(
            "info",
            `Worker ${process.pid} : started http server on ` + port
        );
    });
