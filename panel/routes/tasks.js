const express = require('express');
const router = express.Router();

const tasksController = require('../controllers/tasksController');

router.get('/', tasksController.tasksGet);
router.post('/', tasksController.tasksPost);
router.get('/delete', tasksController.taskDelete);

module.exports = router;