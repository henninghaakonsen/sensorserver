let temperaturer = {};
let noder = {};

exports.getLatestTemperature = id => {
    return temperaturer[id];
};

exports.getLatestTemperatures = () => {
    return temperaturer;
};

exports.insertTemperature = (id, data) => {
    temperaturer = {
        ...temperaturer,
        [id]: data
    };
};

exports.getNoder = () => {
    return noder;
};

exports.insertNode = node => {
    noder = {
        ...noder,
        [node.id]: node
    };
};
