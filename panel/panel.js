const express = require('express');
const session = require('express-session');
const config = require('../config');
const database = require('../database/database');
const login = require('./routes/login');
const bots = require('./routes/bots');
const tasks = require('./routes/tasks');
const settings = require('./routes/settings');
const logout = require('./routes/logout');
const builds = require('./routes/builds');

const panel = express.Router();

panel.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true
}));

panel.use(express.json());
panel.use(express.urlencoded({ extended: false }));

(async () => {
    const exist = await database.userExist("admin");
    if (!exist) {
        await database.createUser("admin", "admin");
        console.log("The database has been successfully initialized and the administrator user has been created. His credentials are admin:admin.")
        console.log("http://localhost/panel/login");
    }
})();

panel.use('/login', login);
panel.use('/', bots);
panel.use('/tasks', tasks);
panel.use('/settings', settings);
panel.use('/logout', logout);
panel.use('/builds', builds);
panel.get('/*', async (req, res) => {
    return res.redirect('/panel/');
})

module.exports = panel