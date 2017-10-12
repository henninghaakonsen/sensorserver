var ObjectID = require('mongodb').ObjectID;
let api = '/api';

module.exports = function (app, db) {
  app.get(api + '/nodes/:id', (req, res) => {
    const id = req.params.id;
    const interval = req.query.interval;

    let coeff = 1000 * 60 * interval    
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;

    let id_interval = null
    if(interval != 0) {
      id_interval = id + "_" + interval
      fromDate = new Date((Math.round(new Date(req.query.fromDate).getTime() / coeff) * coeff) - coeff).toISOString()
    } else {
      id_interval = id
    }

    db.collection(id_interval).find({
      "timestamp": {
        $gte: fromDate,
        $lt: toDate,
      }
    }).sort({ timestamp: 1 }).toArray(function (err, information) {
      if (err) {
        res.send({ 'error': 'An error has occurred, ' + err });
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.send({ information });
      }
    });
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
    let timestamp = new Date(data.timestamp);
    let currentTime = new Date();

    data.latency = (currentTime.getTime() - timestamp.getTime()) / 1000;
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

  var createAvgCollection = function (id, interval) {
    // Drop the old collection and generate new data
    let id_interval = id + "_" + interval

    db.collection(id_interval).find({}).limit(1).toArray(function (err, information) {
      if (err) {
        console.log(err)
      }

      if (information.length > 0) {
        db.collection(id_interval).drop();
      }
    })

    db.collection(id).find({}).sort({ timestamp: 1 }).toArray(function (err, nodeInfo) {
      if (err) {
        console.log("Error", err)
      } else {
        let newDict = {}

        var coeff = 1000 * 60 * interval

        let toDate = new Date()

        let dateIndexFrom = new Date((Math.round(new Date(nodeInfo[0].timestamp).getTime() / coeff) * coeff) - coeff)
        let dateIndexTo = new Date(dateIndexFrom.getTime() + coeff)

        let latencyIndex = 0
        let coverageIndex = 0

        let latencyAvg = 0
        let latencyAvgCount = 0

        let coverageAvg = 0
        let coverageAvgCount = 0
        let nodeInfoLength = nodeInfo.length;
        let setDateIndex = true

        let currentDate = new Date(nodeInfo[0].timestamp)
        let i = 0

        while (currentDate.getTime() < toDate.getTime()) {
          const key = dateIndexFrom.toISOString()
          if ((currentDate.getTime() >= dateIndexFrom.getTime() && currentDate.getTime() <= dateIndexTo.getTime()) && i < nodeInfoLength) {
            let elem = newDict[key]

            if (elem == undefined) {
              elem = []
              elem[0] = nodeInfo[i].latency
              elem[1] = nodeInfo[i].type == "coverage" ? nodeInfo[i].coverage : -120
            } else {
              elem[0] = (nodeInfo[i].latency + elem[0]) / 2

              if (nodeInfo[i].type == "coverage") {
                if (elem[1] == -120) elem[1]  = nodeInfo[i].coverage
                else (nodeInfo[i].coverage + elem[1]) / 2
              }
            }

            newDict[key] = elem
            i++
            if (i < nodeInfoLength) currentDate = new Date(nodeInfo[i].timestamp)

            if (currentDate.getTime() >= dateIndexTo.getTime()) {
              dateIndexFrom = new Date(dateIndexFrom.getTime() + coeff)
              dateIndexTo = new Date(dateIndexFrom.getTime() + coeff)
            }
          } else {
            if (i == nodeInfoLength) break

            newDict[key] = [0, -120]

            dateIndexFrom = new Date(dateIndexFrom.getTime() + coeff)
            dateIndexTo = new Date(dateIndexTo.getTime() + coeff)

            if (i == nodeInfoLength) currentDate = dateIndexTo
          }
        }

        let count = 0
        for (var key in newDict) {
          let timeKey = new Date(key).getTime()
          timeKey = new Date(key).toISOString()
          let data = { timestamp: key, latency: newDict[key][0], coverage: newDict[key][1] }
          db.collection(id_interval).insert(data, (err, result) => {
            if (err) {
              console.log("Error", err)
            }
          });
        }
      }
    })
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
    let interval = req.query.interval;

    if (interval == undefined) interval = 5

    res.header('Access-Control-Allow-Origin', '*');
    res.send("OK");

    createAvgCollection(id, interval)
  });
}
