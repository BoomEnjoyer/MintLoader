const database = require('../../database/database');

exports.loginGet = async (req, res) => {
    if (typeof req.session.username != 'undefined') {
        return res.redirect('/panel/');
    }
    
    return res.render('login');
};

exports.loginPost = async (req, res) => {
    const username = req.body.username,
        password = req.body.password;

    if (typeof username == 'undefined' || username == '' || typeof password == 'undefined' || password == '') {
        return res.render('login', {
            error: "The password or login provided is empty."
        });
    }

    const user = await database.verifyLogin(username, password);
    if (user == null) {
        return res.render('login', {
            error: "The password or login provided is incorrect."
        });
    }

    req.session.username = username;
    req.session.userid = user._id;
    return res.redirect('/panel/');
};