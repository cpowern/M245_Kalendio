const express = require('express');
const router = express.Router();
const { getExamples } = require('../controllers/exampleController');

router.get('/', getExamples);

module.exports = router;
