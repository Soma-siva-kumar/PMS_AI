const mongoose = require('mongoose');
require('dotenv').config();

const cleanDb = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected successfully.');

        const collections = await mongoose.connection.db.collections();
        
        for (let collection of collections) {
            console.log(`Clearing collection: ${collection.collectionName}`);
            await collection.deleteMany({});
        }

        console.log('Database cleaned successfully.');
        console.log('You can now register a fresh Admin account.');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning database:', error);
        process.exit(1);
    }
};

cleanDb();
