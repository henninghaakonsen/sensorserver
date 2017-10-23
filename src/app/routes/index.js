const dataRoutes = require('./api_sensordata');

module.exports = function (app, db) {
  dataRoutes(app, db);
};
