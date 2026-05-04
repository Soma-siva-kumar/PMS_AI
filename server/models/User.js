const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Patient', 'Caretaker', 'Family Member', 'Staff', 'Admin'],
        default: 'Patient'
    },
    uniqueId: {
        type: String,
        unique: true
    },
    connections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    profilePicture: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    hospitalName: {
        type: String,
        default: ''
    },
    hospitalLocation: {
        type: String,
        default: ''
    },
    admissionDate: {
        type: Date,
        default: null
    },
    roomNumber: {
        type: String,
        default: ''
    },
    admittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
