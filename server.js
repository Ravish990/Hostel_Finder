const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI;


// Connect to MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

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
        const { minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER } = req.query;

        const hostels = await Hostel.find({
            price: { $gte: minPrice, $lte: maxPrice },
        });

        // Construct full image URLs for each hostel
        const hostelsWithImages = hostels.map((hostel) => ({
            ...hostel.toObject(),
            image: `http://localhost:3000/images/${hostel.image}`,
        }));

        res.json(hostelsWithImages);
    } catch (error) {
        res.status(500).send(error);
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
