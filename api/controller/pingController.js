const database = require('../../database/database');

exports.pingPost = async (req, res) => {
    const id = req.params.id;

    if (typeof id == 'undefined' || id == '') {
        return res.sendStatus(400);
    }

    await database.newPing(id);

    return res.sendStatus(200);
};