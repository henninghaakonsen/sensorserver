var ObjectID = require('mongodb').ObjectID;
var moment = require('moment')
let api = '/api';
const cluster = require('cluster');

var Logger = require("filelogger");
const logger = new Logger("error", "info", "general.log");

module.exports = function (app, db) {
  require('./generate_average')(db);

  app.get(api + '/nodes/:id', (req, res) => {
    const id = req.params.id;
    const interval = req.query.interval;

    let coeff = 1000 * 60 * interval
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;

    let id_interval = null
    if (interval != 0) {
      id_interval = id + "_" + interval
    } else {
      id_interval = id
    }

    if (fromDate == undefined || toDate == undefined) {
      db.collection(id_interval).find().sort({ timestamp: 1 }).toArray(function (err, information) {
        if (err) {
          logger.log("error", "find failed: ", err);
          res.send({ 'error': 'An error has occurred, ' + err });
        } else {
          res.header('Access-Control-Allow-Origin', '*');
          res.send({ information });
        }
      });
    } else {
      db.collection(id_interval).find({
        "timestamp": {
          $gte: fromDate,
          $lte: toDate,
        }
      }).sort({ timestamp: 1 }).toArray(function (err, information) {
        if (err) {
          logger.log("error", "find failed: ", err);
          res.send({ 'error': 'An error has occurred, ' + err });
        } else {
          res.header('Access-Control-Allow-Origin', '*');
          res.send({ information });
        }
      });
    }
  });

  app.get(api + '/nodes', (req, res) => {
    db.collection('nodes').find({}).toArray(function (err, nodes) {
      if (err) {
        logger.log("error", "get failed: ", err);
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.send({ nodes });
      }
    });
  });

  app.post(api + '/nodes', (req, res) => {
    const data = req.body;
    db.collection('nodes').insert(data, (err, result) => {
      if (err) {
        logger.log("error", "insert failed: ", err);
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  app.post(api + '/nodes/:id', (req, res) => {
    let data = req.body;
    let timestamp = moment.utc(data.timestamp);
    data.timestamp = timestamp.format()
    var currentTime = moment.utc();

    data.latency = (currentTime.valueOf() - timestamp.valueOf()) / 1000;
    data.coverage = data.type == "coverage" ? data.coverage * 1.0 : 0

    logger.log("info", data, " - pid: ", process.pid)

    const id = req.params.id;
    const displayName = data.displayName;

    //find if the node id exists
    db.collection('nodes').find({ id: id }).toArray(function (err, doc) {
      // It does not exist, so add it to the db
      if (doc.length == 0) {
        let data = { 'id': id, 'displayName': displayName }
        db.collection('nodes').insert(data, (err, result) => {
          if (err) {
            logger.log("error", "find failed: ", err);
            res.send({ 'error': 'An error has occurred' });
          }
        });
      }
    });

    db.collection(id).insert(data, (err, result) => {
      if (err) {
        logger.log("error", "insert failed: ", err);
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  app.post(api + '/nodes/remove/:id', (req, res) => {
    const id = req.params.id;

    db.collection('nodes').deleteOne({ id }, (err, result) => {
      if (err) {
        logger.log("error", "delete failed: ", err);
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send({ 'sucess': 'id: \'' + id + '\' removed' });
      }
    });
  });

  app.post(api + '/generateAverage', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.send("OK");

    avgCreation(5)
    avgCreation(10)
    avgCreation(30)
    avgCreation(60)
  });

  app.post(api + '/nodes/generateAverage/:id', (req, res) => {
    const id = req.params.id;

    res.header('Access-Control-Allow-Origin', '*');

    if (id != undefined) {
      res.send("OK")
      createAvgCollection(id, 5)
      createAvgCollection(id, 10)
      createAvgCollection(id, 30)
      createAvgCollection(id, 60)
    } else res.send("ERROR, undefined id")
  });
}
