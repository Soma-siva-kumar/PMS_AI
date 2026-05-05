const router = require('express').Router();
const User = require('../models/User');
const ConnectionRequest = require('../models/ConnectionRequest');
const { upload, uploadVideo } = require('../utils/cloudinary');

// Upload AI Demo Video
router.post('/upload-ai-video/:userId', uploadVideo.single('video'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { 
                aiSourceUrl: req.file.path,
                aiSourceType: 'file' 
            },
            { new: true }
        );

        res.json({ 
            message: 'Video uploaded successfully', 
            url: req.file.path,
            user 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fetch all Caretakers and Staff (filtered by Admin for security)
router.get('/caretakers', async (req, res) => {
    try {
        const { admittedBy } = req.query;
        let query = { role: { $in: ['Caretaker', 'Staff'] } };
        
        // If admittedBy is provided, filter by it for secure hospital scoping
        if (admittedBy) {
            query.admittedBy = admittedBy;
        }

        const staff = await User.find(query).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fetch all Patients (filtered by Admin for security)
router.get('/patients', async (req, res) => {
    try {
        const { admittedBy } = req.query;
        let query = { role: 'Patient' };

        if (admittedBy) {
            query.admittedBy = admittedBy;
        }

        const patients = await User.find(query).select('-password');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search Users with Connection Status
router.get('/search', async (req, res) => {
    try {
        const { query, role, excludeRole, currentUserId } = req.query;
        let filter = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { uniqueId: { $regex: query, $options: 'i' } }
            ]
        };
        
        if (role) filter.role = role;
        if (excludeRole) filter.role = { $ne: excludeRole };
        if (currentUserId) filter._id = { $ne: currentUserId }; // Don't find self

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

        const request = new ConnectionRequest({ sender: senderId, recipient: recipientId, acceptedByRecipient: false });
        await request.save();

        // Real-time notification
        const io = req.app.get('io');
        io.to(recipientId).emit('new-notification');

        res.status(201).json({ message: 'Request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin-Initiated Connection (Assign Patient to Staff)
router.post('/admin-assign', async (req, res) => {
    try {
        const { staffId, patientId } = req.body;
        
        // Check if already exists
        const existing = await ConnectionRequest.findOne({
            $or: [
                { sender: staffId, recipient: patientId },
                { sender: patientId, recipient: staffId }
            ],
            status: { $in: ['pending', 'accepted'] }
        });
        if (existing) return res.status(400).json({ message: 'Request or connection already exists' });

        const request = new ConnectionRequest({
            sender: staffId,
            recipient: patientId,
            initiatedByAdmin: true,
            acceptedBySender: false,
            acceptedByRecipient: false
        });
        await request.save();

        // Real-time notification to both parties
        const io = req.app.get('io');
        io.to(staffId).emit('new-notification');
        io.to(patientId).emit('new-notification');

        res.status(201).json({ message: 'Assignment request sent to both parties' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Notifications (Pending Requests)
router.get('/notifications/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const requests = await ConnectionRequest.find({
            status: 'pending',
            $or: [
                { recipient: userId, acceptedByRecipient: false },
                { sender: userId, initiatedByAdmin: true, acceptedBySender: false }
            ]
        })
        .populate('sender', 'name uniqueId role')
        .populate('recipient', 'name uniqueId role')
        .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Respond to Request (Accept/Reject)
router.post('/respond', async (req, res) => {
    try {
        const { requestId, status, userId } = req.body;
        const request = await ConnectionRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (status === 'rejected') {
            request.status = 'rejected';
            await request.save();
            return res.json({ message: 'Request rejected' });
        }

        if (status === 'accepted') {
            if (request.initiatedByAdmin) {
                // Determine who is accepting
                if (request.sender.toString() === userId) {
                    request.acceptedBySender = true;
                } else if (request.recipient.toString() === userId) {
                    request.acceptedByRecipient = true;
                }

                // If both accepted, finalize
                if (request.acceptedBySender && request.acceptedByRecipient) {
                    request.status = 'accepted';
                    await User.findByIdAndUpdate(request.sender, { $addToSet: { connections: request.recipient } });
                    await User.findByIdAndUpdate(request.recipient, { $addToSet: { connections: request.sender } });
                }
            } else {
                // Standard user-to-user request
                request.status = 'accepted';
                await User.findByIdAndUpdate(request.sender, { $addToSet: { connections: request.recipient } });
                await User.findByIdAndUpdate(request.recipient, { $addToSet: { connections: request.sender } });
            }
            await request.save();
        }

        res.json({ message: `Request updated successfully` });
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
        const { name, email, phoneNumber, hospitalName, hospitalLocation, admissionDate, roomNumber, admittedBy } = req.body;
        const updateData = { name, email, phoneNumber };
        
        // Only update hospital fields if they are provided
        if (hospitalName !== undefined) updateData.hospitalName = hospitalName;
        if (hospitalLocation !== undefined) updateData.hospitalLocation = hospitalLocation;
        if (admissionDate !== undefined) updateData.admissionDate = admissionDate;
        if (roomNumber !== undefined) updateData.roomNumber = roomNumber;
        if (admittedBy !== undefined) updateData.admittedBy = admittedBy;

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

// Upload Profile Picture
router.post('/upload-profile/:userId', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { profilePicture: req.file.path },
            { new: true }
        );
        
        res.json({ 
            message: 'Profile picture updated', 
            profilePicture: req.file.path 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
