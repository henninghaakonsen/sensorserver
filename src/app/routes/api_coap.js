var ObjectID = require('mongodb').ObjectID;
var moment = require('moment')
let api = '/api';

var Logger = require("filelogger");
const logger = new Logger("error", "info", "general.log");

const elements = [ "signal_power", "total_power", "tx_power", "tx_time", "rx_time", "cell_id", "ecl", "snr", "earfcn", "pci", "rsrq", "timestamp", "msg_id"]

module.exports = function (server, db) {
  require('./db_utils')(db);
  
  server.on('request', function(req, res) {
    let id
    for ( var option of req.options ) {
      if ( option["name"] == "Uri-Path" ) {
        id = "id" + option["value"].toString();
      }
    }

    const payload_size = req.rsinfo['size']
    const data = req.payload.toString().slice(0, -1);

    if (id == undefined || data == undefined) return

    const splitted_payload = data.split('_');

    dict = new Object()
    counter = 0
    for ( var key of elements ) {
      dict[key] = splitted_payload[counter++]
    }
    dict["ip"] = req.rsinfo['address']

    post_id(id, dict, req, res)
  })
}
