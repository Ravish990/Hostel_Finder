const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

// MongoDB connection URI
const mongoUri = process.env.MONGO_URI;


// Connect to MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Mongoose schemas
const hostelSchema = new mongoose.Schema({
    name: String,
    location: String,
    price: Number,
    amenities: [String],
    rating: Number,
    image: String, // New field for the image filename
});

const Hostel = mongoose.model('Hostel', hostelSchema);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API to add a single hostel
app.post('/hostels', async (req, res) => {
    try {
        const newHostel = new Hostel(req.body);
        await newHostel.save();
        res.send(newHostel);
    } catch (error) {
        res.status(400).send(error);
    }
});

// API to add multiple hostels
app.post('/bulk-hostels', async (req, res) => {
    try {
        const hostels = req.body;
        await Hostel.insertMany(hostels);
        res.send({ message: 'Hostels added successfully' });
    } catch (error) {
        res.status(400).send(error);
    }
});

// API to search for hostels by price range
app.get('/hostels/search', async (req, res) => {
    try {
        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
        
        console.log(`Searching for hostels with price between ${minPrice} and ${maxPrice}`);

        const hostels = await Hostel.find({
            price: { $gte: minPrice, $lte: maxPrice },
        });
        
        console.log(`Found ${hostels.length} hostels`);

        // Construct full image URLs for each hostel
        const hostelsWithImages = hostels.map((hostel) => {
            if (!hostel) {
                console.error('Found null hostel in results');
                return null;
            }
            return {
                ...hostel.toObject(),
                image: `http://localhost:3000/images/${hostel.image}`,
                _id: hostel._id.toString() // Convert ObjectId to string
            };
        }).filter(Boolean); // Remove any null entries

        res.json(hostelsWithImages);
    } catch (error) {
        console.error('Error in /hostels/search:', error);
        res.status(500).json({ error: error.message });
    }
});

// API to delete all hostels
app.delete('/hostels', async (req, res) => {
    try {
        await Hostel.deleteMany({});
        res.send({ message: 'All hostels deleted successfully' });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Add a route to seed the database with initial data
app.post('/seed-database', async (req, res) => {
    try {
        // First, clear the existing data
        await Hostel.deleteMany({});
        
        // Read the hostels.json file
        const hostelsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'hostels.json'), 'utf8'));
        
        // Insert the data into MongoDB
        await Hostel.insertMany(hostelsData);
        
        res.json({ message: 'Database seeded successfully', count: hostelsData.length });
    } catch (error) {
        console.error('Error seeding database:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a route to check database status
app.get('/api/status', async (req, res) => {
    try {
        const count = await Hostel.countDocuments();
        res.json({ 
            status: 'ok',
            message: 'Connected to database',
            hostelsCount: count
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
