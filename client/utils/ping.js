const axios = require('axios');
const core = require('./core');
const config = require('../config');

async function runPing() {
    while (true) {
        await core.sleep(1000 * 60 * 5);
        try {
            axios.post(config.baseurl + '/ping/' + config.id);
        } catch (e) { }
    }
}

module.exports = {
    runPing
}