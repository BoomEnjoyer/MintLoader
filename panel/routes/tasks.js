const express = require('express');
const router = express.Router();

const tasksController = require('../controllers/tasksController');

router.get('/', tasksController.tasksGet);
router.post('/', tasksController.tasksPost);

module.exports = router;