const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate unique ID
const generateUniqueId = async (role) => {
    const prefixes = {
        'Patient': 'P',
        'Caretaker': 'C',
        'Family Member': 'F',
        'Staff': 'S',
        'Admin': 'A'
    };
    const prefix = prefixes[role] || 'U';
    const lastUser = await User.findOne({ role }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastUser && lastUser.uniqueId) {
        const lastNum = parseInt(lastUser.uniqueId.substring(1));
        if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
        }
    }
    return `${prefix}${nextNum}`;
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, hospitalName, hospitalLocation } = req.body;
        
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Data allocation validation for Admins
        if (role === 'Admin' && (!hospitalName || !hospitalLocation)) {
            return res.status(400).json({ message: 'Hospital Name and Location are required for Admin accounts' });
        }

        const uniqueId = await generateUniqueId(role);
        const user = new User({ 
            name, 
            email, 
            password, 
            role, 
            uniqueId,
            hospitalName: hospitalName || '',
            hospitalLocation: hospitalLocation || ''
        });
        await user.save();

        res.status(201).json({ message: 'User registered successfully', uniqueId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                role: user.role, 
                uniqueId: user.uniqueId,
                hospitalName: user.hospitalName,
                hospitalLocation: user.hospitalLocation
            } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
