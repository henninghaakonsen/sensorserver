const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const db = require('../config/db');
const server = express();
var path = require('path');
var public = __dirname + "/app/public/";
const port = process.env.PORT || 8020;

var coap = require('coap')
var coap_server = coap.createServer()

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

server.use(express.static(path.join(__dirname, 'app/public')))
server.enable('trust proxy')

server.use(bodyParser.urlencoded({ extended: true }));
server.get('/', function (req, res) {
  res.sendFile(path.join(public + "index.html"));
});

var Logger = require("filelogger");
const logger = new Logger("error", "info", "general.log");

const fork_worker = function () {
  const worker = cluster.fork();
  worker.on('message', function (msg) {
    worker.send({ id: worker.id });
  });
}

MongoClient.connect(db.url, (err, database) => {
  if (err) return console.log(err)

  if (cluster.isMaster) {
    logger.log("info", `Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      fork_worker();
    }

    // Respawn workers on exit
    cluster.on('exit', (worker, code, signal) => {
      logger.log("error", `worker pid: ${worker.process.pid}, id: ${worker.id} died`);

      fork_worker();
    });
  } else {
    // Send message to master process to get appropriate id
    process.send({ msgFromWorker: '' })

    // Receive message from the master process.
    process.on('message', function (msg) {
      let id = msg.id;
      
      if (id == 1 && numCPUs > 1) {
        logger.log("info", `Worker ${process.pid} : ${id} started analysis worker`)
        require('./app/routes/db_utils')(database);
      } else if (id > numCPUs / 2) {
        require('./app/routes/api_coap')(coap_server, database);
        coap_server.listen(port, () => {
          logger.log("info", `Worker ${process.pid} : ${id} started coap server on ` + port);
        })
      } else {
        require('./app/routes/api_sensordata')(server, database);
        server.listen(port, () => {
          logger.log("info", `Worker ${process.pid} : ${id} started http server on ` + port);
        });
      }
    });
  }
})




