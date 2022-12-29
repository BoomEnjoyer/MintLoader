const express = require("express");
const tasks = require('./routes/tasks');
const ping = require('./routes/ping');
const report = require('./routes/report');

const api = express.Router();

api.use(express.text());
api.use(express.json());

api.use('/tasks', tasks);
api.use('/ping', ping);
api.use('/report', report);

module.exports = api