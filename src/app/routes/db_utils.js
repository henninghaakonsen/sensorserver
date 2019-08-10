const { insertTemperature, getNoder, insertNode } = require("./cache");

exports.post_id = function(id, data, req, res, server) {
    if (server == "HTTP") data.ip = req.ip;

    let displayName =
        data.displayName != undefined ? data.displayName : "id" + id;

    const noder = getNoder();

    if (!noder[id]) {
        insertNode({
            id,
            displayName
        });
    }

    insertTemperature(id, data);
    res.status(200).send("OK");
};
