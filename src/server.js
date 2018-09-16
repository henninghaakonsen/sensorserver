const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const db = require('../config/db');
const server = express();
var path = require('path');
var public = __dirname + "/app/public/";
const port = process.env.PORT || 9000;

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

var express_logger = require('logger-request');
server.use(express_logger({
  filename: 'requests.log',
  daily: true,
}))

server.use(express.static(path.join(__dirname, 'app/public')))
server.enable('trust proxy')

server.use(bodyParser.urlencoded({ extended: true }));
server.get('/', function (req, res) {
  res.sendFile(path.join(public + "index.html"));
});

var Logger = require("filelogger");
const logger = new Logger("error", "info", "general.log");

MongoClient.connect(db.url, (err, database) => {
  let worker_map = {}

  const notify_worker = function (worker, id) {
    worker_map[worker.id] = id

    worker.on('message', function (msg) {
      worker.send({ id: id });
    });
  }

  if (err) return console.log(err)

  if (cluster.isMaster) {
    logger.log("info", `Master ${process.pid} is running`);

    // Fork workers.
    let id_to_worker = 0
    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork();
      if (i == 0 && numCPUs > 1) {
        id_to_worker = 1;
      } else {
        id_to_worker = 2;
      }

      notify_worker(worker, id_to_worker);
    }


    // Respawn workers on exit
    cluster.on('exit', (worker, code, signal) => {
      logger.log("info", `worker pid: ${worker.process.pid}, id: ${worker.id} died`);
      const new_worker = cluster.fork();

      logger.log("info", "kind of worker ", worker.id, ": ", worker_map[worker.id])
      notify_worker(new_worker, worker_map[worker.id]);
      
      // Remove old entry from map
      delete worker_map[worker.id]
    });
  } else {
    // Send message to master process to get appropriate id
    process.send({ msgFromWorker: '' })

    // Receive message from the master process.
    process.on('message', function (msg) {
      let id = msg.id;

      if (id == 1 && numCPUs > 1) {
        logger.log("info", `Worker ${process.pid} : ${id} started analysis worker`)
        require('./app/routes/db_utils')(database, id);
      } else {
        require('./app/routes/api_sensordata')(server, database);
        server.listen(port, () => {
          logger.log("info", `Worker ${process.pid} : ${id} started http server on ` + port);
        });
      }
    });
  }
})




