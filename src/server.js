const express        = require('express');
const MongoClient    = require('mongodb').MongoClient;
const bodyParser     = require('body-parser');
const db             = require('../config/db');
const app            = express();
var path = require('path');
var public = __dirname + "/app/public/";
const port = process.env.PORT || 8020;

console.log(process.env.PORT)
console.log(port)

app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', function(req, res) {
    res.sendFile(path.join(public + "index.html"));
});

MongoClient.connect(db.url, (err, database) => {
  if (err) return console.log(err)

  require('./app/routes')(app, database);
  app.listen(port, () => {
    console.log('We are live on ' + port);
  });
})
