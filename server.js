const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ClassData = require('./models/ClassData');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// Secure fetch for Student View
app.get('/api/classes/:uuid', async (req, res) => {
    try {
        const classData = await ClassData.findOne({ uuid: req.params.uuid });
        if (!classData) {
            return res.status(404).json({ error: 'Class not found or invalid link.' });
        }
        res.json(classData);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching class data' });
    }
});

// Full data fetch for Admin View (Links + Leaderboard)
app.get('/api/admin/data', async (req, res) => {
    try {
        // Fetches class ID, secure UUID, and the subjects array for the leaderboard
        const classes = await ClassData.find({}, 'classId uuid subjects');
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching admin data' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));