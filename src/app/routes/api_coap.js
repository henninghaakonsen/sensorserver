var ObjectID = require('mongodb').ObjectID;
var moment = require('moment')
let api = '/api';

var Logger = require("filelogger");
const logger = new Logger("error", "info", "general.log");

module.exports = function (server, db) {
  require('./db_utils')(db);

  server.on('message', function(msg, rinfo) {
    logger.log("info", `server got: ${msg} from ${JSON.stringify(rinfo)}`);

    /*var id = req.options[2]['value'].toString();
    var data = JSON.parse(req.payload.toString());
    if (id == undefined || data == undefined) return

    post_id(id, data, req, res, 'COAP')*/
  })
}
