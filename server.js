const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ClassData = require('./models/ClassData');

const app = express();
app.use(cors());
app.use(express.json());

// Basic Authentication Middleware
const protectRoute = (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    
    // Default credentials for the admin dashboard
    const validUser = process.env.ADMIN_USER || 'admin';
    const validPass = process.env.ADMIN_PASS || 'AISadmin2026';

    if (login && password && login === validUser && password === validPass) {
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
};

// Protect the Admin Dashboard & Admin API before loading the static files
app.use('/admin.html', protectRoute);
app.use('/api/admin', protectRoute);

app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// DYNAMIC GRADE LEVEL NORMS DICTIONARY
const TARGET_NORMS = {
    "10": {
        "Math": { "Fall": 230, "Winter": 232, "Spring": 234 },
        "Reading": { "Fall": 221, "Winter": 223, "Spring": 225 },
        "Language": { "Fall": 220, "Winter": 222, "Spring": 224 },
        "Science": { "Fall": 215, "Winter": 218, "Spring": 220 }
    }
};

// Secure fetch for Student View
app.get('/api/classes/:uuid', async (req, res) => {
    try {
        const classData = await ClassData.findOne({ uuid: req.params.uuid });
        if (!classData) return res.status(404).json({ error: 'Class not found.' });
        res.json(classData);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Data Fetch
app.get('/api/admin/data', async (req, res) => {
    try {
        const classes = await ClassData.find({}, 'classId uuid subjects');
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// CSV Upload Processor
app.post('/api/admin/import', async (req, res) => {
    try {
        const parsedData = req.body; 
        
        for (const row of parsedData) {
            // Automatically look up the correct norm target based on grade, subject, and term
            const norm = TARGET_NORMS[row.grade]?.[row.subject]?.[row.term] || 0; 
            
            // Upsert Logic: Find class or create new
            let classDoc = await ClassData.findOne({ classId: row.classId });
            if (!classDoc) {
                classDoc = new ClassData({ classId: row.classId, gradeLevel: row.grade, subjects: [] });
            }

            // Find subject or create new
            let subjectDoc = classDoc.subjects.find(s => s.name === row.subject);
            if (!subjectDoc) {
                classDoc.subjects.push({ name: row.subject, mapScores: [] });
                subjectDoc = classDoc.subjects[classDoc.subjects.length - 1];
            }

            // Find term score or create new
            let scoreDoc = subjectDoc.mapScores.find(s => s.term === row.term);
            if (scoreDoc) {
                scoreDoc.ritScore = row.ritScore;
                scoreDoc.nationalNorm = norm;
            } else {
                subjectDoc.mapScores.push({ term: row.term, ritScore: row.ritScore, nationalNorm: norm });
            }

            await classDoc.save();
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Import failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));