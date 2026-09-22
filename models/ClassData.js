const mongoose = require('mongoose');
const crypto = require('crypto');

const mapScoreSchema = new mongoose.Schema({
    term: { type: String, required: true },
    ritScore: { type: Number, required: true },
    nationalNorm: { type: Number, required: true } 
});

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mapScores: [mapScoreSchema]
});

const classSchema = new mongoose.Schema({
    classId: { type: String, required: true, unique: true },
    gradeLevel: { type: Number, required: true }, 
    uuid: { type: String, default: () => crypto.randomUUID(), unique: true },
    subjects: [subjectSchema]
});

module.exports = mongoose.model('ClassData', classSchema);