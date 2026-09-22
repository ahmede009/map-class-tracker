const mongoose = require('mongoose');
require('dotenv').config();
const ClassData = require('./models/ClassData');
const fs = require('fs');

const rawData = fs.readFileSync('data.json');
const classesToImport = JSON.parse(rawData);

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB. Clearing old data...');
        await ClassData.deleteMany({});
        
        for (const classObj of classesToImport) {
            await ClassData.findOneAndUpdate(
                { classId: classObj.classId },
                { $set: { subjects: classObj.subjects } },
                { upsert: true, returnDocument: 'after' } 
            );
            console.log(`Imported full curriculum for ${classObj.classId}`);
        }
        
        console.log('Bulk import complete!');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });