const express = require('express');
const router = express.Router();

const tasksController = require('../controller/tasksController');

router.get('/:id', tasksController.taskGet);

module.exports = router