const dataRoutes = require('./api_sensordata');
const webApp = require('./web_app');

module.exports = function(app, db) {
  dataRoutes(app, db);
  webApp(app, db);
  // Other route groups could go here, in the future
};
