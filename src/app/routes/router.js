let api = "/api";

const {
    getLatestTemperature,
    getLatestTemperatures,
    getNoder
} = require("./cache");
const { post_id } = require("./db_utils");

exports.setupRouter = server => {
    server.get(api + "/temperature_now/:id", (req, res) => {
        const id = req.params.id;

        res.header("Access-Control-Allow-Origin", "*");
        res.send(getLatestTemperature(id));
    });

    server.get(api + "/temperatures_now", (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.send(getLatestTemperatures());
    });

    server.get(api + "/nodes", (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.send(getNoder());
    });

    server.post(api + "/nodes/:id", (req, res) => {
        let data = req.body;
        const id = req.params.id;
        post_id(id, data, req, res);
    });
};
