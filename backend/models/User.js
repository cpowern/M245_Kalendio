// user.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, unique: true },
    avatar: { type: String },
    joinedCalendars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' }],
    createdAt: { type: Date, default: Date.now },
});

// Hash password before saving (falls ein Passwort gesetzt ist)
UserSchema.pre('save', async function (next) {
    if (this.password && !this.isModified('password')) return next();
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
