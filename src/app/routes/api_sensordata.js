

var ObjectID = require('mongodb').ObjectID;
let api = '/api';

module.exports = function(app, db) {
  app.get(api + '/data/:id', (req, res) => {
    const id = req.params.id;
    const details = { '_id': new ObjectID(id) };
    db.collection('data').findOne(details, (err, item) => {
      if (err) {
        res.send({'error':'An error has occurred'});
      } else {
        res.send(item);
      }
    });
  });

  app.get(api + '/data', (req, res) => {
    db.collection('data').find({}).toArray(function (err, docs) {
      if (err) {
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send(docs);
      }
    });
  });

  app.post(api + '/data', (req, res) => {
    // You'll create your note here.
    console.log(req.body)
    const data = req.body;
    db.collection('data').insert(data, (err, result) => {
      if (err) {
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send(result.ops[0]);
      }
    });
  });
}
