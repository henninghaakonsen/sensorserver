var moment = require('moment')
const cluster = require('cluster')

var Worker = require('webworker-threads');

var Logger = require("filelogger");
const gen_logger = new Logger("info", "info", "general.log");
const logger = new Logger("info", "info", "average.log");

module.exports = function (db) {
    this.post_id = function (id, data, req, res, server) {
        if (server == 'HTTP') data.ip = req.ip

        logger.log("info", data.displayName + ": " + data.temperature + " - " + data.timestamp + " - " + data.ip)

        const displayName = data.displayName;

        //find if the node id exists
        db.collection('nodes').find({ id: id }).toArray(function (err, doc) {
            // It does not exist, so add it to the db
            if (doc.length == 0) {
                let data = { 'id': id, 'displayName': displayName }
                db.collection('nodes').insert(data, (err, result) => {
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
                if (server == 'HTTP') res.send(result.ops[0]);
                else if (server == 'COAP') res.end(result.ops[0])
            }
        });
    }

    const calculateAndInsertAveragesInternal = function (nodeInfo, id, interval) {
        let id_interval = id + "_" + interval

        db.collection(id_interval).find({}).limit(2).toArray(function (err, information) {
            if (err) {
                logger.log("error", "Error when searching for id_interval collection - " + err)
                return null
            } else {
                if (information.length > 0) {
                    db.collection(id_interval).drop(function (err) {
                        if (err) {
                            logger.log("error", "Error drop: ", err)
                        }
                    });
                }
            }

            db.collection(id_interval).find({}).limit(2).toArray(function (err, information) {
                let newDict = {}

                var coeff = 1000 * 60 * interval

                let dateIndexFrom = moment.utc((Math.round(moment.utc(nodeInfo[0].timestamp).valueOf() / coeff) * coeff) - coeff)
                let dateIndexTo = moment.utc(dateIndexFrom.valueOf() + coeff)

                let temperatureIndex = 0

                let temperatureAvg = 0
                let temperatureAvgCount = 0
                let nodeInfoLength = nodeInfo.length;
                let setDateIndex = true

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
                            elem[0] = nodeInfo[index].temperature
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

                let count = 0
                let dataCollection = []
                for (var key in newDict) {
                    let timeKey = moment.utc(key).valueOf()
                    timeKey = moment.utc(key).toISOString()
                    let data = { timestamp: key, temperature: newDict[key][0], temperaturePoints: newDict[key][1] }
                    dataCollection.push(data)
                }

                logger.log("info", "Insert '" + dataCollection.length + "' elements into '" + id_interval + "'")
                db.collection(id_interval).insertMany(dataCollection, { ordered: true });
            });
        });
    }

    this.calculateAndInsertAverages = function (id, interval) {
        db.collection(id).find({}).sort({ timestamp: 1 }).toArray(function (err, nodeInfo) {
            if (err) {
                logger.log("error", "Error when collecting information about node id '" + id + "' - " + err)
            } else {
                calculateAndInsertAveragesInternal(nodeInfo, id, interval)
            }
        });
    };

    const avg_creation_internal = function (interval) {
        db.collection('nodes').find({}).toArray(function (err, nodes) {
            if (err) {
                logger.log("error", "Error" + err)
            } else {
                for (let i = 0; i < nodes.length; i++) {
                    this.calculateAndInsertAverages(nodes[i].id, interval)
                }
            }
        });
    }

    this.avgCreation = function (interval) {
        logger.log("info", "avg creation" + interval)
        Worker.create().eval(avg_creation_internal(interval))
    }

    if (cluster.worker.id == 1) {
        gen_logger.log("info", `Worker ${process.pid} started... Analysis worker`)
        setInterval(this.avgCreation, 1000 * 60 * 5, 5);
        setInterval(this.avgCreation, 1000 * 60 * 10, 10);
        setInterval(this.avgCreation, 1000 * 60 * 30, 30);
        setInterval(this.avgCreation, 1000 * 60 * 60, 60);
    }
}