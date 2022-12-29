const database = require('../../database/database');


exports.tasksGet = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    const tasks = await database.getTasks(req.session.username);
    return res.render('tasks', {
        tasks: tasks,
        username: req.session.username
    });
};

exports.tasksPost = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    const goal = req.body.goal,
        param = req.body.param,
        targeted = req.body.targeted;
    let countries = req.body.countries;

    if (typeof goal == 'undefined' || goal == ''  || typeof param == 'undefined' || param == ''
            || typeof targeted == 'undefined' || targeted == '' || typeof countries == '' || countries == '') {
        return res.render('tasks', {
            error: "Some fields are empty / undefined."
        });
    }

    if (countries != "*") {
        countries = countries.replace(/ /gm, '').split(',');
    } else {
        countries = ["*"]
    }

    await database.addTask(req.session.username, goal, param, targeted, countries);
    const tasks = await database.getTasks(req.session.username);

    return res.render('tasks', {
        tasks: tasks,
        username: req.session.username
    })
};

exports.taskDelete = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    const id = req.query.id;

    if (typeof id == 'undefined' || id == '') {
        return res.redirect('/panel/tasks');
    }

    await database.deleteTask(id, req.session.username);

    return res.redirect('/panel/tasks');
}