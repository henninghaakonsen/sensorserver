const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const db = require('../config/db');
const server = express();
var path = require('path');
var public = __dirname + "/app/public/";
const port = process.env.PORT || 8020;

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

server.use(express.static(path.join(__dirname, 'app/public')))

server.use(bodyParser.urlencoded({ extended: true }));
server.get('/', function (req, res) {
  res.sendFile(path.join(public + "index.html"));
});

var Logger = require("filelogger");
const logger = new Logger("error", "info", "general.log");

MongoClient.connect(db.url, (err, database) => {
  if (err) return console.log(err)

  if (cluster.isMaster) {
    logger.log("info", `Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs - 2; i++) {
      cluster.fork();
    }

    // Respawn workers on exit
    cluster.on('exit', (worker, code, signal) => {
      logger.log("error", `worker ${worker.process.pid} died`);
      cluster.fork();
    });
  } else {
    if (cluster.worker.id == 1 && numCPUs > 1) {
      require('./app/routes/generate_average')(database);
    } else {
      require('./app/routes/api_sensordata')(server, database);
      server.listen(port, () => {
        logger.log("info", `Worker ${process.pid} started on ` + port);
      });
    }
  }
})