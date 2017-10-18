var ObjectID = require('mongodb').ObjectID;
var moment = require('moment')
let api = '/api';

module.exports = function (app, db) {
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

    const id = req.params.id;
    const displayName = data.displayName;

    //find if the node id exists
    db.collection('nodes').find({ id: id }).toArray(function (err, doc) {
      // It does not exist, so add it to the db
      if (doc.length == 0) {
        let data = { 'id': id, 'displayName': displayName }
        db.collection('nodes').insert(data, (err, result) => {
          if (err) {
            res.send({ 'error': 'An error has occurred' });
          }
        });
      }
    });

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

    db.collection('nodes').deleteOne({ id }, (err, result) => {
      if (err) {
        res.send({ 'error': 'An error has occurred' });
      } else {
        res.send({ 'sucess': 'id: \'' + id + '\' removed' });
      }
    });
  });

  var calculateAndInsertAverages = function (id, interval, id_interval) {
    db.collection(id).find({}).sort({ timestamp: 1 }).toArray(function (err, nodeInfo) {
      if (err) {
        console.log("Error when collecting information about node id '" + id + "' - ", err)
      } else {
        let newDict = {}

        var coeff = 1000 * 60 * interval

        let toDate = moment.utc()

        let dateIndexFrom = moment.utc((Math.round(moment.utc(nodeInfo[0].timestamp).valueOf() / coeff) * coeff) - coeff)
        let dateIndexTo = moment.utc(dateIndexFrom.valueOf() + coeff)

        let latencyIndex = 0
        let coverageIndex = 0

        let latencyAvg = 0
        let latencyAvgCount = 0

        let coverageAvg = 0
        let coverageAvgCount = 0
        let nodeInfoLength = nodeInfo.length;
        let setDateIndex = true

        let currentDate = moment.utc(nodeInfo[0].timestamp)
        let index = 0
        console.log("Beginning generating values for '", id_interval, "'")
        while (currentDate.valueOf() < toDate.valueOf()) {
          const key = dateIndexFrom.format()
          if ((currentDate.valueOf() >= dateIndexFrom.valueOf() && currentDate.valueOf() <= dateIndexTo.valueOf()) && index < nodeInfoLength) {
            let elem = newDict[key]

            if (elem == undefined) {
              elem = []
              elem[0] = nodeInfo[index].latency
              elem[1] = nodeInfo[index].type == "coverage" ? nodeInfo[index].coverage : -120
              elem[2] = 1
              elem[3] = nodeInfo[index].type == "coverage" ? 1 : 0
            } else {
              elem[0] = (nodeInfo[index].latency + elem[0]) / 2
              elem[2] += 1

              if (nodeInfo[index].type == "coverage") {
                if (elem[1] == -120) elem[1] = nodeInfo[index].coverage
                else (nodeInfo[index].coverage + elem[1]) / 2
                elem[3] += 1
              }
            }

            newDict[key] = elem
            index += 1
            if (index < nodeInfoLength) currentDate = moment.utc(nodeInfo[index].timestamp)

            if (currentDate.valueOf() >= dateIndexTo.valueOf()) {
              dateIndexFrom = moment.utc(dateIndexFrom.valueOf() + coeff)
              dateIndexTo = moment.utc(dateIndexFrom.valueOf() + coeff)
            }
          } else {
            dateIndexFrom = moment.utc(dateIndexFrom.valueOf() + coeff)
            dateIndexTo = moment.utc(dateIndexTo.valueOf() + coeff)

            newDict[key] = [0, -120, 0, 0]

            if (index == nodeInfoLength) currentDate = dateIndexTo
          }
        }

        let count = 0
        let dataCollection = []
        for (var key in newDict) {
          let timeKey = moment.utc(key).valueOf()
          timeKey = moment.utc(key).toISOString()
          let data = { timestamp: key, latency: newDict[key][0], coverage: newDict[key][1], latencyDataPoints: newDict[key][2], coverageDataPoints: newDict[key][3] }
          dataCollection.push(data)
        }

        console.log("Insert '", dataCollection.length,"' elements into '", id_interval, "'")
        db.collection(id_interval).insertMany(dataCollection, { ordered: true });
      }
    });
  }

  var createAvgCollection = function (id, interval) {
    // Drop the old collection and generate new data
    let id_interval = id + "_" + interval

    db.collection(id_interval).find({}).limit(2).toArray(function (err, information) {
      if (err) {
        console.log("Error when searching for id_interval collection - ", err)
        return null
      } else {
        if (information.length > 0) {
          db.collection(id_interval).drop(function (err) {
            if (err) {
              console.log("Error drop: ", err)
            }
          });
        }
      }

      calculateAndInsertAverages(id, interval, id_interval);
    });
  };


  var avg5Creation = function () {
    db.collection('nodes').find({}).toArray(function (err, nodes) {
      if (err) {
        console.log("Error", err)
      } else {
        for (let i = 0; i < nodes.length; i++) {
          createAvgCollection(nodes[i].id, 5)
        }
      }
    });
  }

  var avg10Creation = function () {
    db.collection('nodes').find({}).toArray(function (err, nodes) {
      if (err) {
        console.log("Error", err)
      } else {
        for (let i = 0; i < nodes.length; i++) {
          createAvgCollection(nodes[i].id, 10)
        }
      }
    });
  }

  var avg30Creation = function () {
    db.collection('nodes').find({}).toArray(function (err, nodes) {
      if (err) {
        console.log("Error", err)
      } else {
        for (let i = 0; i < nodes.length; i++) {
          createAvgCollection(nodes[i].id, 30)
        }
      }
    });
  }

  var avg60Creation = function () {
    db.collection('nodes').find({}).toArray(function (err, nodes) {
      if (err) {
        console.log("Error", err)
      } else {
        for (let i = 0; i < nodes.length; i++) {
          createAvgCollection(nodes[i].id, 60)
        }
      }
    });
  }

  setInterval(avg5Creation, 1000 * 60 * 5);
  setInterval(avg10Creation, 1000 * 60 * 10);
  setInterval(avg30Creation, 1000 * 60 * 30);
  setInterval(avg60Creation, 1000 * 60 * 60);

  app.post(api + '/generateAverage', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.send("OK");

    avg5Creation();
    avg10Creation();
    avg30Creation();
    avg60Creation();
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
