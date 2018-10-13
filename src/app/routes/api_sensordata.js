let api = '/api';

var Logger = require("filelogger");
const logger = new Logger("error", "info", "general.log");

module.exports = function (server, db) {
  require('./db_utils')(db);

  server.get(api + '/nodes/:id', (req, res) => {
    const id = req.params.id;
    const interval = req.query.interval;

    let id_interval = null

    if (interval === undefined) {
      id_interval = id;
    } else {
      id_interval = id + "_" + interval
    }

    db.collection(id_interval).find().sort({ timestamp: 1 }).toArray(function (err, information) {
      if (err) {
        logger.log("error", "find failed: " + err);
        res.send({ 'error': 'An error has occurred, ' + err });
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.send({ information });
      }
    });
  });

  server.get(api + '/temperature_now/:id', (req, res) => {
    const id = req.params.id;

    db.collection(id + "_1").find().sort({ timestamp: -1 }).limit(1).toArray(function (err, information) {
      if (err) {
        logger.log("error", "find failed: " + err);
        res.send({ 'error': 'An error has occurred, ' + err });
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.send({ information });
      }
    });
  });

  server.get(api + '/nodes', (req, res) => {
    db.collection('nodes').find({}).toArray(function (err, nodes) {
      if (err) {
        logger.log("error", "get failed: " + err);
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.send({ nodes });
      }
    });
  });

  server.post(api + '/nodes', (req, res) => {
    const data = req.body;
    db.collection('nodes').insert(data, (err, result) => {
      if (err) {
        logger.log("error", "insert failed: " + err);
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  server.post(api + '/nodes/:id', (req, res) => {
    let data = req.body;
    const id = req.params.id;
    post_id(id, data, req, res)
  })

  server.post(api + '/nodes/remove/:id', (req, res) => {
    const id = req.params.id;

    db.collection('nodes').deleteOne({ id }, (err, result) => {
      if (err) {
        logger.log("error", "delete failed: " + err);
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send({ 'sucess': 'id: \'' + id + '\' removed' });
      }
    });
  });
}
