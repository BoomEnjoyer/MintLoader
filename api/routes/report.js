const express = require('express');
const router = express.Router();

const reportController = require('../controller/reportController');

router.post('/:id', reportController.reportDecrypt);
router.post('/:id', reportController.reportPost);

module.exports = router