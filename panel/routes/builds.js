const express = require('express');
const router = express.Router();

const buildsController = require('../controllers/buildsController');

router.get('/', buildsController.buildsGet);
router.post('/', buildsController.buildsPost);
router.get('/delete', buildsController.buildDelete);

module.exports = router;