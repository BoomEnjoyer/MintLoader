const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settingsController');

router.get('/', settingsController.settingsGet);
router.post('/password', settingsController.changePassword);

module.exports = router;