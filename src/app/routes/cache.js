let temperaturer = {};
let noder = {};

exports.getLatestTemperature = id => {
    return temperaturer[id];
};

exports.getLatestTemperatures = () => {
    return temperaturer;
};

exports.insertTemperature = (id, data) => {
    console.log(temperaturer);
    temperaturer = {
        ...temperaturer,
        [id]: data
    };
};

exports.getNoder = () => {
    return noder;
};

exports.insertNode = node => {
    console.log(noder);
    noder = {
        ...noder,
        [node.id]: node
    };
};
