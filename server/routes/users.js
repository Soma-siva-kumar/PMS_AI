const router = require('express').Router();
const User = require('../models/User');

const ConnectionRequest = require('../models/ConnectionRequest');

// Fetch all Caretakers and Staff (for Admin)
router.get('/caretakers', async (req, res) => {
    try {
        // Support both 'Caretaker' and 'Staff' roles in the global directory
        const staff = await User.find({ 
            role: { $in: ['Caretaker', 'Staff'] } 
        }).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fetch all Patients (for Admin)
router.get('/patients', async (req, res) => {
    try {
        const patients = await User.find({ role: 'Patient' }).select('-password');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search Users with Connection Status
router.get('/search', async (req, res) => {
    try {
        const { query, role, currentUserId } = req.query;
        let filter = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { uniqueId: { $regex: query, $options: 'i' } }
            ]
        };
        if (role) filter.role = role;

        const users = await User.find(filter).select('-password').lean();
        
        // Enhance with connection status
        const enhancedUsers = await Promise.all(users.map(async (u) => {
            const request = await ConnectionRequest.findOne({
                $or: [
                    { sender: currentUserId, recipient: u._id },
                    { sender: u._id, recipient: currentUserId }
                ]
            }).sort({ createdAt: -1 }); // Get the latest request
            
            // If rejected, treat it as 'none' so they can connect again
            const status = (request && request.status !== 'rejected') ? request.status : 'none';
            return { ...u, connectionStatus: status };
        }));

        res.json(enhancedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send Connection Request
router.post('/connect', async (req, res) => {
    try {
        const { senderId, recipientId } = req.body;
        
        // Remove any existing rejected requests to make it fresh
        await ConnectionRequest.deleteMany({ 
            $or: [
                { sender: senderId, recipient: recipientId, status: 'rejected' },
                { sender: recipientId, recipient: senderId, status: 'rejected' }
            ]
        });

        // Check if a pending or accepted request already exists
        const existing = await ConnectionRequest.findOne({ 
            $or: [
                { sender: senderId, recipient: recipientId },
                { sender: recipientId, recipient: senderId }
            ],
            status: { $in: ['pending', 'accepted'] }
        });

        if (existing) return res.status(400).json({ message: 'Request already exists or connected' });

        const request = new ConnectionRequest({ sender: senderId, recipient: recipientId });
        await request.save();
        res.status(201).json({ message: 'Request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Notifications (Pending Requests)
router.get('/notifications/:userId', async (req, res) => {
    try {
        const requests = await ConnectionRequest.find({ recipient: req.params.userId, status: 'pending' })
            .populate('sender', 'name uniqueId role')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Respond to Request (Accept/Reject)
router.post('/respond', async (req, res) => {
    try {
        const { requestId, status } = req.body;
        const request = await ConnectionRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            // Add to both users' connections
            await User.findByIdAndUpdate(request.sender, { $addToSet: { connections: request.recipient } });
            await User.findByIdAndUpdate(request.recipient, { $addToSet: { connections: request.sender } });
        }

        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Connected Users
router.get('/connections/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('connections', '-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.connections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Profile Photo
router.put('/profile/:userId/photo', async (req, res) => {
    try {
        const { photo } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.userId, 
            { profilePicture: photo }, 
            { new: true }
        ).select('-password');
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Profile Details
router.put('/profile/:userId', async (req, res) => {
    try {
        const { name, email, phoneNumber, hospitalName, hospitalLocation, admissionDate, roomNumber } = req.body;
        const updateData = { name, email, phoneNumber };
        
        // Only update hospital fields if they are provided
        if (hospitalName !== undefined) updateData.hospitalName = hospitalName;
        if (hospitalLocation !== undefined) updateData.hospitalLocation = hospitalLocation;
        if (admissionDate !== undefined) updateData.admissionDate = admissionDate;
        if (roomNumber !== undefined) updateData.roomNumber = roomNumber;

        const user = await User.findByIdAndUpdate(
            req.params.userId, 
            updateData, 
            { new: true }
        ).select('-password');
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Profile Details
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
