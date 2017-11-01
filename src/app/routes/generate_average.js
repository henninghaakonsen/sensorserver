var moment = require('moment')
const cluster = require('cluster')

var Worker = require('webworker-threads');

var Logger = require("filelogger");
const gen_logger = new Logger("info", "info", "general.log");
const logger = new Logger("info", "info", "average.log");

module.exports = function (db) {
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
                logger.log("info", "Beginning generating values for '" + id_interval + "'")
                while (index < nodeInfoLength) {
                    const key = dateIndexTo.format()
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
        gen_logger.log("info", `Worker ${process.pid} - set interval`)
        setInterval(this.avgCreation, 1000 * 60 * 5, 5);
        setInterval(this.avgCreation, 1000 * 60 * 10, 10);
        setInterval(this.avgCreation, 1000 * 60 * 30, 30);
        setInterval(this.avgCreation, 1000 * 60 * 60, 60);
    }
}