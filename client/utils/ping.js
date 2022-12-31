const axios = require('axios');
const core = require('./core');
const config = require('../config');

async function runPing(botId) {
    while (true) {
        await core.sleep(1000 * 60 * 5);
        axios.post(config.baseurl + '/ping/' + botId).catch(function (error) { });
    }
}

module.exports = {
    runPing
}