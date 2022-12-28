const mongoose = require("mongoose");

const botSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    ownerusername: String,
    hostname: String,
    ip: String,
    country: [String],
    av: String,
    firstStart: Date,
    lastPing: Date,
});

module.exports = botSchema