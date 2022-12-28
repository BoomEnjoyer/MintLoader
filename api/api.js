const express = require("express");

const api = express.Router();

//TODO: api
api.get('/test', async (req, res) => {
    res.send('test');
});

module.exports = api