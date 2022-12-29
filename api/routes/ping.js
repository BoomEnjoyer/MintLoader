const express = require('express');
const router = express.Router();

const pingController = require('../controller/pingController');

router.post('/:id', pingController.pingPost);

module.exports = router