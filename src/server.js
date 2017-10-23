const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const db = require('../config/db');
const app = express();
var path = require('path');
var public = __dirname + "/app/public/";
const port = process.env.PORT || 8020;

const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

app.use(express.static(path.join(__dirname, 'app/public')))

app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', function (req, res) {
  res.sendFile(path.join(public + "index.html"));
});

MongoClient.connect(db.url, (err, database) => {
  if (err) return console.log(err)

  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
      cluster.fork();
    });
  } else {
    if (cluster.worker.id == 1) {
      require('./app/routes/generate_average')(database);
    } else {
      require('./app/routes/api_sensordata')(app, database);
      app.listen(port, () => {
        console.log(`Worker ${process.pid} started on`, port);
      });
    }
  }
})
