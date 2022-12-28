const express = require('express');
const router = express.Router();

const buildsController = require('../controllers/buildsController');

router.get('/', buildsController.buildsGet);
router.post('/', buildsController.buildsPost);

module.exports = router;