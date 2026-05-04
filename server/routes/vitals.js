const router = require('express').Router();
const Vital = require('../models/Vital');

// Update/Add new vitals
router.post('/update', async (req, res) => {
    try {
        const { patient, heartRate, bloodPressure, temperature, spo2, bloodLevel, salineLevel } = req.body;
        
        const newVital = new Vital({
            patient,
            heartRate,
            bloodPressure,
            temperature,
            spo2,
            bloodLevel,
            salineLevel
        });

        await newVital.save();
        res.status(201).json(newVital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get latest vitals for a patient
router.get('/:patientId/latest', async (req, res) => {
    try {
        const vital = await Vital.findOne({ patient: req.params.patientId })
            .sort({ timestamp: -1 });
        res.json(vital || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get latest vitals for all patients (bulk)
router.get('/latest-all', async (req, res) => {
    try {
        // Find latest record for each patient using aggregation
        const vitals = await Vital.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$patient',
                    latestVital: { $first: '$$ROOT' }
                }
            }
        ]);
        
        // Populate patient details if needed, but for now just return the map
        // We'll map _id to the patient uniqueId in the frontend if needed, 
        // but here we return a map of patient ObjectId -> latest vital
        const result = {};
        vitals.forEach(v => {
            result[v._id] = v.latestVital;
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get history (last 10 records)
router.get('/:patientId/history', async (req, res) => {
    try {
        const history = await Vital.find({ patient: req.params.patientId })
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
