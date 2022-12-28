const database = require('../../database/database');

exports.botsGet = async (req, res) => {
    if (typeof req.session.username == 'undefined') {
        return res.redirect('/panel/login');
    }

    const bots = await database.getBots(req.session.username);

    return res.render('bots', {
        bots: bots,
        username: req.session.username
    })
};