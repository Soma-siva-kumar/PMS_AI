const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    heartRate: {
        type: Number,
        required: true
    },
    bloodPressure: {
        type: String, // e.g., "120/80"
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
    spo2: {
        type: Number,
        required: true
    },
    bloodLevel: {
        type: Number, // e.g., Hemoglobin in g/dL
        required: true
    },
    salineLevel: {
        type: Number, // Percentage 0-100
        required: true,
        default: 100
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Vital = mongoose.model('Vital', vitalSchema);
module.exports = Vital;
