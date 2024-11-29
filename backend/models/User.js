const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    googleId: { type: String, unique: true, sparse: true }, // Optional for Google OAuth
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // For manual registration
    avatar: { type: String }, // Optional profile picture URL
    createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);
