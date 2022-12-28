const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    req.session.destroy();
    return res.redirect('/panel/login');
});

module.exports = router;