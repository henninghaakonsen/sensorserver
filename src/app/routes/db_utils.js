var moment = require('moment')

var Logger = require("filelogger");
const logger = new Logger("info", "info", "average.log");

module.exports = function (db, id) {
    this.post_id = function (id, data, req, res, server) {
        if (server == 'HTTP') data.ip = req.ip

        logger.log( "info", id + ": " + JSON.stringify(data) );
        let displayName = data.displayName != undefined ? data.displayName : "id" + id

        //find if the node id exists
        db.collection('nodes').find({ id: id }).toArray(function (err, doc) {
            // It does not exist, so add it to the db
            if (doc.length == 0) {
                let data = { 'id': id, 'displayName': displayName }

                db.collection('nodes').insert(data, (err) => {
                    if (err) {
                        logger.log("error", "find failed: " + err);
                        res.send({ 'error': 'An error has occurred' });
                    }
                });
            }
        });

        // Insert data
        db.collection(id).insert(data, (err, result) => {
            if (err) {
                logger.log("error", "insert failed: " + err);
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send(result.ops[0]);
            }
        });
    }

    const analyze = (nodeInfo, id, interval) => {
        let newDict = {}

        const coeff = 1000 * 60 * interval
        const id_interval = id + "_" + interval

        let dateIndexFrom = moment.utc((Math.round(moment.utc(nodeInfo[0]).valueOf() / coeff) * coeff) - coeff)
        let dateIndexTo = moment.utc(dateIndexFrom.valueOf() + coeff)

        let nodeInfoLength = nodeInfo.length;

        let currentDate = moment.utc(nodeInfo[0].timestamp)
        let index = 0
        logger.log("info", "Beginning generating values for '" + id_interval + "'")
        
        let emptyArea = true
        while (index < nodeInfoLength) {
            const key = dateIndexTo.format()
            if ((currentDate.valueOf() >= dateIndexFrom.valueOf() && currentDate.valueOf() <= dateIndexTo.valueOf()) && index < nodeInfoLength) {
                emptyArea = true
                let elem = newDict[key]

                console.log(nodeInfo[index].temperature)
                if (elem == undefined) {
                    elem = []
                    elem[0] = parseFloat(nodeInfo[index].temperature)
                    elem[1] = 1
                } else {
                    elem[0] = (parseFloat(nodeInfo[index].temperature) + parseFloat(elem[0])) / 2
                    elem[1] += 1
                }
                console.log(elem)

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

                if (emptyArea) newDict[key] = [0, 0]
                emptyArea = false

                if (index == nodeInfoLength) currentDate = dateIndexTo
            }
        }

        let dataCollection = []
        for (var key in newDict) {
            let data = { timestamp: key, temperature: newDict[key][0], temperaturePoints: newDict[key][1] }
            dataCollection.push(data)
        }

        db.collection(id).drop()

        logger.log("info", "Insert '" + dataCollection.length + "' elements into '" + id_interval + "'")
        db.collection(id_interval).insertMany(dataCollection, { ordered: true });
    }

    const calculateAndInsertAveragesInternal = (id, interval) => {
        let id_interval = id + "_" + interval

        db.collection(id_interval).find({}).sort({_id:-1}).limit(1).toArray((err, analyzedInfo) => {
            if (err) {
                logger.log("error", "Error when searching for id_interval collection - " + err)
                return null
            }

            if (analyzedInfo.length === 0) {
                db.collection(id).find({}).sort({ timestamp: 1 }).toArray((err, detailedInfo) => {
                    if (detailedInfo.length === 0) return;

                    analyze(detailedInfo, id, interval)
                })
            } else {
                db.collection(id).find({
                    "timestamp": {
                      $gte: analyzedInfo[0].timestamp,
                      $lte: new Date().toISOString(),
                    }
                  }).sort({ timestamp: 1 }).toArray((err, detailedInfo) => {
                    if (detailedInfo.length === 0) return;

                    analyze(detailedInfo, id, interval)
                })
            }
        })
    }

    const avg_creation_internal = interval => {
        db.collection('nodes').find({}).toArray(function (err, nodes) {
            if (err) {
                logger.log("error", "Error" + err)
            } else {
                for (let i = 0; i < nodes.length; i++) {
                    calculateAndInsertAveragesInternal(nodes[i].id, interval)
                }
            }
        });
    }

    this.avgCreation = () => {
        console.log('analyze')
        avg_creation_internal(1)
        avg_creation_internal(5)
        avg_creation_internal(10)
    }

    if (id == 1) {
        setInterval(this.avgCreation, 1000 * 60 * 1, 0);
    }
}