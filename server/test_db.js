const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI;

console.log('Testing connection to:', MONGO_URI.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('SUCCESS: MongoDB connection established');
        process.exit(0);
    })
    .catch((error) => {
        console.error('FAILURE: MongoDB connection error:', error);
        process.exit(1);
    });
