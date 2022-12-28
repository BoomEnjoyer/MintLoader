const database = require('../../database/database');


exports.settingsGet = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    return res.render('settings');
};

exports.changePassword = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    if (typeof password == 'undefined' || password == '' || typeof passwordConfirm == 'undefined' || passwordConfirm == '') {
        return res.render('settings', {
            password_error: "Some fields are empty / undefined.",
            username: req.session.username
        });
    }

    if (password != passwordConfirm) {
        return res.render('settings', {
            password_error: "The passwords do not match.",
            username: req.session.username
        });
    }

    await database.changePassword(req.session.username, password);
    
    req.sessionStore.all(function (err, sessions) {
        for (sid in sessions) {
            const session = sessions[sid];
            if (typeof session.username != 'undefined') {
                if (req.session.username == session.username && req.sessionID != sid) {
                    req.sessionStore.destroy(sid)
                }
            }
        }
    });
    
    return res.render('settings', {
        password_confirm: "The password has been changed.",
        username: req.session.username
    });
};