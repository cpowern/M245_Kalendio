
const exampleData = require('../models/exampleModel');

const getExamples = (req, res) => {
    res.json(exampleData);
};

module.exports = { getExamples };
