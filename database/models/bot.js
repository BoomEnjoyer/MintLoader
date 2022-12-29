const mongoose = require("mongoose");

const botSchema = mongoose.Schema({
    ownerusername: String,
    hostname: String,
    ip: String,
    country: [String],
    av: String,
    os: String,
    firstStart: Date,
    lastPing: Date,
});

module.exports = botSchema