

var ObjectID = require('mongodb').ObjectID;
let api = '/api';

module.exports = function(app, db) {
  app.get(api + '/nodes/:id', (req, res) => {
    const id = req.params.id;

    db.collection(id).find({}).toArray(function (err, information) {
      if (err) {
        res.send({'error':'An error has occurred'});
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.send({information});
      }
    });
  });

  app.get(api + '/nodes', (req, res) => {
    db.collection('nodes').find({}).toArray(function (err, nodes) {
      if (err) {
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.send({nodes});
      }
    });
  });

  app.post(api + '/nodes', (req, res) => {
    const data = req.body;
    db.collection('nodes').insert(data, (err, result) => {
      if (err) {
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  app.post(api + '/nodes/:id', (req, res) => {
    let data = req.body;
    let timestamp = new Date(data.timestamp);
    let currentTime = new Date();

    data.latency = (currentTime.getTime() - timestamp.getTime()) / 1000;

    const id = req.params.id;

    db.collection(id).insert(data, (err, result) => {
      if (err) {
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  app.post(api + '/nodes/remove/:id', (req, res) => {
    const id = req.params.id;

    db.collection('nodes').deleteOne({id}, (err, result) => {
      if (err) {
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send({ 'sucess': 'id: \'' + id + '\' removed' });
      }
    });
  });
}
