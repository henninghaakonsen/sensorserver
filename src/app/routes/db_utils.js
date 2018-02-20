var moment = require('moment')
const cluster = require('cluster')

var Worker = require('webworker-threads');

var Logger = require("filelogger");
const gen_logger = new Logger("info", "info", "general.log");
const logger = new Logger("info", "info", "average.log");

module.exports = function (db, id) {
    this.post_id = function (id, data, req, res, server) {
        if (data.timestamp == undefined || !moment.utc(data.timestamp, "YY/MM/DD,HH:mm:ssZ").isValid() ) {
            logger.log("info", "Payload not recognized: " + JSON.stringify(data));
            res.send({ 'error': 'An error has occurred' });
            return;
        }

        let timestamp = moment.utc(data.timestamp, "YY/MM/DD,HH:mm:ssZ");
        data.timestamp = timestamp.format();
        var current_time = moment.utc();

        data.latency = (current_time.valueOf() - timestamp.valueOf()) / 1000;

        logger.log( "info", id + ": " + JSON.stringify(data) );
        if (data.latency >= 2) logger.log("error", "latency high: " + data.latency);
        let displayName = data.displayName != undefined ? data.displayName : "id" + id

        //find if the node id exists
        db.collection('nodes').find({ id: id }).toArray(function (err, doc) {
            // It does not exist, so add it to the db
            if (doc.length == 0) {
                let data = { 'id': id, 'displayName': displayName }
                console.log(data)
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

    const calculateAndInsertInternal = function (nodeInfo, id) {
        let id_interval = id + "_all"

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
                /*"_id" : ObjectId("5a77914b2308550635cccfa4"), "signal_power" : "-1089", "total_power" : "-986", "tx_power" : "230", "tx_time" : "832639", 
                "rx_time" : "4473548", "cell_id" : "33359378", "ecl" : "1", "snr" : "21", "earfcn" : "6252", "pci" : "204", "rsrq" : "-130", 
                "timestamp" : "2018-02-04T23:03:37Z", "msg_id" : "19", "ip" : "178.232.88.151", "latency" : 2.445, "coverage" : -108.9, "type" : "coverage" }*/

                while (index < nodeInfoLength) {
                    if ( nodeInfo[index].timestamp == undefined || !moment(nodeInfo[index].timestamp).isValid() ) {
                        index += 1;
                        continue;
                    }
                    
                    const key = moment.utc(nodeInfo[index].timestamp).format()                    

                    let elem = newDict[key]

                    let coverage = nodeInfo[index].signal_power / 10;
                    let latency = nodeInfo[index].latency;
                    let ecl = nodeInfo[index].ecl;
                    let cell_id = nodeInfo[index].cell_id;
                    let tx_pwr = nodeInfo[index].tx_power / 10;
                    let cell_change = 0;
                    let interrupt = 0;
                    
                    let interval = 0;
                    let tx_time = 0;
                    let rx_time = 0; 
                    let index_0 = 0;
                    let index_1 = 0;

                    if ( index != 0 ) {
                        cell_change = nodeInfo[index].cell_id == nodeInfo[index-1].cell_id ? 0 : 1;
                        interrupt = parseInt( nodeInfo[index-1].msg_id ) < parseInt( nodeInfo[index].msg_id ) ? 0 : 1;                        
                    }

                    if ( index < nodeInfoLength - 1 ) {
                        index_0 = moment(nodeInfo[index].timestamp)
                        index_1 = moment(nodeInfo[index + 1].timestamp)
                        
                        interval = index_1.diff(index_0, "seconds")
                        
                        tx_time = ((nodeInfo[index+1].tx_time - nodeInfo[index].tx_time) / 1000) / interval
                        rx_time = ((nodeInfo[index+1].rx_time - nodeInfo[index].rx_time) / 1000) / interval
                    }

                    elem = []
                    elem[0] = parseInt( nodeInfo[index].msg_id )
                    elem[1] = coverage
                    elem[2] = ecl
                    elem[3] = tx_pwr

                    if ( cell_change == 1 ) {
                        elem[4] = -0.5
                        elem[5] = -0.5
                    } else {
                        elem[4] = rx_time
                        elem[5] = tx_time
                    }
                    
                    elem[6] = latency

                    if ( interrupt ) {
                        let prev_date = new Date(nodeInfo[index].timestamp)
                        let tmp_key = moment.utc(prev_date.getTime() - 1).format()
                        newDict[tmp_key] = [-1, -1, -1, -1, -1, -1, -1]
                    }

                    newDict[key] = elem
                    index += 1
                    prev_key = key
                }

                let count = 0
                let dataCollection = []

                for (var key in newDict) {
                    let timeKey = moment.utc(key).valueOf()
                    timeKey = moment.utc(key).toISOString()

                    let data = { timestamp: key, 
                        msg_id: newDict[key][0], coverage: newDict[key][1], ecl: newDict[key][2],
                        tx_pwr: newDict[key][3], rx_time: newDict[key][4], tx_time: newDict[key][5],
                        latency: newDict[key][6]
                    }
                    dataCollection.push(data)
                }

                logger.log("info", "Insert '" + dataCollection.length + "' elements into '" + id_interval + "'")
                db.collection(id_interval).insertMany(dataCollection, { ordered: true });
            });
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
                
                let emptyArea = true
                while (index < nodeInfoLength) {
                    const key = dateIndexTo.format()
                    if ((currentDate.valueOf() >= dateIndexFrom.valueOf() && currentDate.valueOf() <= dateIndexTo.valueOf()) && index < nodeInfoLength) {
                        if ( nodeInfo[index].timestamp == undefined || !moment(nodeInfo[index].timestamp).isValid() ) {
                            continue;
                        }

                        emptyArea = true
                        let elem = newDict[key]

                        const coverage = nodeInfo[index].signal_power / 10;
                        const latency = nodeInfo[index].latency;

                        let power_usage = undefined
                        if (index != 0) {
                            power_usage = Math.pow( 10, ( parseInt( nodeInfo[index].tx_power ) / 100 )  ) * ( (nodeInfo[index].tx_time - nodeInfo[index-1].tx_time) / 1000 );
                        }

                        if (elem == undefined) {
                            elem = []
                            elem[0] = parseInt( nodeInfo[index].msg_id )
                            elem[2] = 1

                            elem[3] = latency
                            elem[4] = latency
                            elem[5] = latency
                            elem[6] = coverage
                            elem[7] = coverage
                            elem[8] = coverage

                            if ( power_usage != undefined ) {
                                elem[9] = power_usage
                                elem[10] = power_usage
                                elem[11] = power_usage
                            }
                        } else {
                            elem[1] = parseInt( nodeInfo[index].msg_id )
                            elem[2] += 1
                            
                            elem[3] = (latency + elem[3]) / 2
                            if ( elem[4] > latency ) {
                                elem[4] = latency
                            }
    
                            if ( elem[5] < latency ) {
                                elem[5] = latency
                            }

                            elem[6] = (coverage + elem[6]) / 2                            
                            if ( elem[7] > coverage ) {
                                elem[7] = coverage
                            }
    
                            if ( elem[8] < coverage ) {
                                elem[8] = coverage
                            }

                            if ( elem[9] != undefined ) {
                                elem[9] = (elem[9] + power_usage) / 2

                                if ( elem[10] > power_usage ) {
                                    elem[10] = power_usage
                                }
        
                                if ( elem[11] < power_usage ) {
                                    elem[11] = power_usage
                                }
                            } else {
                                elem[9] = power_usage
                                elem[10] = power_usage
                                elem[11] = power_usage
                            }
                        }

                        newDict[key] = elem
                        index += 1
                        if (index < nodeInfoLength) {
                            currentDate = moment.utc(nodeInfo[index].timestamp)
                        }

                        if (currentDate.valueOf() >= dateIndexTo.valueOf()) {
                            dateIndexFrom = moment.utc(dateIndexFrom.valueOf() + coeff)
                            dateIndexTo = moment.utc(dateIndexFrom.valueOf() + coeff)
                        }
                    } else {
                        dateIndexFrom = moment.utc(dateIndexFrom.valueOf() + coeff)
                        dateIndexTo = moment.utc(dateIndexTo.valueOf() + coeff)

                        if (emptyArea) newDict[key] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                        emptyArea = false

                        if (index == nodeInfoLength) currentDate = dateIndexTo
                    }
                }

                let count = 0
                let dataCollection = []
                for (var key in newDict) {
                    let timeKey = moment.utc(key).valueOf()
                    timeKey = moment.utc(key).toISOString()

                    let data = { timestamp: key, 
                        first_msg_id: newDict[key][0], last_msg_id: newDict[key][1], data_points: newDict[key][2],
                        avg_latency: newDict[key][3], min_latency: newDict[key][4], max_latency: newDict[key][5], 
                        avg_coverage: newDict[key][6], min_coverage: newDict[key][7], max_coverage: newDict[key][8],
                        avg_power_usage: newDict[key][9], min_power_usage: newDict[key][10], max_power_usage: newDict[key][11]
                    }
                    dataCollection.push(data)
                }

                logger.log("info", "Insert '" + dataCollection.length + "' elements into '" + id_interval + "'")
                //db.collection(id_interval).insertMany(dataCollection, { ordered: true });
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

    this.calculateAndInsert = function (id) {
        db.collection(id).find({}).sort({ timestamp: 1 }).toArray(function (err, nodeInfo) {
            if (err) {
                logger.log("error", "Error when collecting information about node id '" + id + "' - " + err)
            } else {
                calculateAndInsertInternal(nodeInfo, id)
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
                    this.calculateAndInsert(nodes[i].id)
                }
            }
        });
    }

    this.avgCreation = function (interval) {
        logger.log("info", "avg creation" + interval)
        Worker.create().eval(avg_creation_internal(interval))
    }

    // TODO check other id
    if (id == 1) {
        setInterval(this.avgCreation, 1000 * 60 * 5, 5);
        setInterval(this.avgCreation, 1000 * 60 * 10, 10);
        setInterval(this.avgCreation, 1000 * 60 * 30, 30);
        setInterval(this.avgCreation, 1000 * 60 * 60, 60);
    }
}