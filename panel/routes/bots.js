const express = require('express');
const router = express.Router();

const botsController = require('../controllers/botsController');

router.get('/', botsController.botsGet);

module.exports = router;