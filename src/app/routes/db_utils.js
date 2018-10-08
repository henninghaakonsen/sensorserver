var moment = require('moment')

var Logger = require("filelogger");
const logger = new Logger("error", "info", "average.log");

module.exports = function (db, id) {
    this.post_id = function (id, data, req, res, server) {
        if (server == 'HTTP') data.ip = req.ip

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
        const id_interval = id + "_" + interval
        
        db.collection(id_interval).find({}).limit(2).toArray(function (err, information) {
            if (information.length > 0) {
                db.collection(id_interval).drop(err => {
                    if (err) {
                        logger.log("error", "Error drop: ", err)
                    }
                });
            }
        });

        let newDict = {}

        const coeff = 1000 * 60 * interval

        let dateIndexFrom = moment.utc((Math.round(moment.utc(nodeInfo[0].timestamp).valueOf() / coeff) * coeff) - coeff)
        let dateIndexTo = moment.utc(dateIndexFrom.valueOf() + coeff)

        let nodeInfoLength = nodeInfo.length;

        let currentDate = moment.utc(nodeInfo[0].timestamp)
        let index = 0

        let emptyArea = true
        const now = moment.utc(moment.utc().valueOf() + coeff);

        while (index < nodeInfoLength && dateIndexTo <= now) {
            const key = dateIndexTo.format()
            if ((currentDate.valueOf() >= dateIndexFrom.valueOf() && currentDate.valueOf() <= dateIndexTo.valueOf()) && index < nodeInfoLength) {
                emptyArea = true
                let elem = newDict[key]

                if (elem == undefined) {
                    elem = []
                    elem[0] = parseFloat(nodeInfo[index].temperature)
                    elem[1] = 1
                } else {
                    elem[0] = (parseFloat(nodeInfo[index].temperature) + parseFloat(elem[0])) / 2
                    elem[1] += 1
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

        db.collection(id_interval).insertMany(dataCollection, { ordered: true });
    }

    const avg_creation_internal = interval => {
        db.collection('nodes').find({}).toArray(function (err, nodes) {
            if (err) {
                logger.log("error", "Error" + err)
            } else {
                for (let i = 0; i < nodes.length; i++) {
                    db.collection(nodes[i].id).find({}).sort({ timestamp: 1 }).toArray((err, detailedInfo) => {
                        if (detailedInfo.length === 0) return;
            
                        analyze(detailedInfo, nodes[i].id, interval)
                    })
                }
            }
        });
    }

    this.avgCreation = () => {
        avg_creation_internal(1)
        avg_creation_internal(5)
        avg_creation_internal(10)
    }

    if (id == 1) {
        setInterval(this.avgCreation, 1000 * 60 * 1, 0);
    }
}