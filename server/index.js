const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for initial deployment simplicity
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Expose io instance to routes
app.set('io', io);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vitals', require('./routes/vitals'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.use((req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Patient Monitoring System API is running in development mode...');
    });
}

// Socket.io Real-time Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // AI Engine connects and joins a room for a specific patient
    socket.on('join-patient-room', (patientId) => {
        socket.join(patientId);
        console.log(`Socket ${socket.id} joined patient room: ${patientId}`);
    });

    // Users join a private room based on their ID for personal notifications
    socket.on('join-user-room', (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined user room: ${userId}`);
    });

    // Admin joins a global admin room to monitor all patients
    socket.on('join-admin-room', () => {
        socket.join('admin-room');
        console.log(`Socket ${socket.id} joined admin room`);
    });

    // Receive data from AI Engine and broadcast to clients in the room
    socket.on('saline-update', (data) => {
        // data: { patientId, percentage, timestamp }
        // Broadcast to specific patient room
        io.to(data.patientId).emit('saline-level', data);
        // Also broadcast to admin room
        io.to('admin-room').emit('saline-level', data);
    });

    socket.on('ai-status', (data) => {
        // data: { status, message, timestamp }
        // Broadcast to admin room for live notification
        io.to('admin-room').emit('ai-notification', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/patient_monitoring';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connection established');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });
