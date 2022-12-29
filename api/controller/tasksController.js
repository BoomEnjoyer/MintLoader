const database = require('../../database/database');
const cache = require('../cache');
const crypto = require('../crypto');

exports.taskGet = async (req, res) => {
    const id = req.params.id;

    if (typeof id == 'undefined' || id == '') {
        return res.sendStatus(400);
    }

    if (cache.get(id) == "") {
        return res.sendStatus(400);
    }

    let user;
    if (cache.get(id) != "" && cache.get(id) != null) {
        user = cache.get(id);
    } else {
        user = await database.getUser(id);
        if (user == null) {
            cache.set(id, "");
            return res.sendStatus(400);
        }
    }

    const result = JSON.stringify(user.tasks);
    res.send(crypto.encrypt(result, user.encryptedKey));
};