const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    encryptedKey: String,
    tasks: [{
        goal: String,
        param: String,
        date: Date,
        targeted: Number,
        completed: Number,
        countries: [String]
    }],
    builds: [{
        date: Date,
        log: String,
        path: String
    }]
});

module.exports = userSchema