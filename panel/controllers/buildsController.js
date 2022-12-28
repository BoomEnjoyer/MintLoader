const database = require('../../database/database');

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
            console.log(build.username, build.name, build.ico, build.antivm);
            //TODO: add build mechanism

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

    const ico = req.body.ico;
    const name = req.body.name;
    const antivm = typeof req.body.antivm != "undefined" && req.body.antivm == 'on';

    if (typeof ico == 'undefined' || ico == '' || typeof name == 'undefined' || name == '') {
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
        username: username,
        ico: ico,
        name: name,
        antivm: antivm
    });

    return res.render('builds', {
        builds: builds,
        info: `Your build has been added to the queue. ETA (${buildQueue.length()} min). Use menu to refresh.`,
        username: req.session.username
    });
};