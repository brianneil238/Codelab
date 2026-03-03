/**
 * Seed 20 students: 10 in section "Secret", 10 in section "Galileo".
 * Each has progress (lecture/quiz completions) and recent last_updated so they show as active.
 * Run from server dir: node seed-students.js
 * Requires MONGODB_URI or DATABASE_URL in .env
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
const DEFAULT_PASSWORD = 'Student123!';

const STUDENTS = [
  // Section Secret (10)
  { section: 'Secret', last: 'Dela Cruz', first: 'Juan', middle: 'M.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Santos', first: 'Maria', middle: 'L.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Reyes', first: 'Carlos', middle: 'A.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Garcia', first: 'Ana', middle: 'S.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Ramos', first: 'Miguel', middle: 'P.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Torres', first: 'Sofia', middle: 'R.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Flores', first: 'Luis', middle: 'C.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Rivera', first: 'Elena', middle: 'D.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Gonzalez', first: 'Diego', middle: 'F.', grade: '11', strand: 'STEM' },
  { section: 'Secret', last: 'Martinez', first: 'Isabella', middle: 'G.', grade: '11', strand: 'STEM' },
  // Section Galileo (10) – Grade 12
  { section: 'Galileo', last: 'Lopez', first: 'Antonio', middle: 'H.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Hernandez', first: 'Carmen', middle: 'I.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Perez', first: 'Fernando', middle: 'J.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Sanchez', first: 'Laura', middle: 'K.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Ramirez', first: 'Roberto', middle: 'L.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Torres', first: 'Patricia', middle: 'M.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Nguyen', first: 'Kevin', middle: 'N.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Chen', first: 'Michelle', middle: 'O.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Kim', first: 'Daniel', middle: 'Q.', grade: '12', strand: 'STEM' },
  { section: 'Galileo', last: 'Villanueva', first: 'Andrea', middle: 'T.', grade: '12', strand: 'STEM' },
];

function slug(section, i) {
  const s = section.toLowerCase().replace(/\s/g, '');
  return `${s}_${i + 1}`;
}

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI or DATABASE_URL in .env');
    process.exit(1);
  }
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');
    const userProgress = db.collection('user_progress');
    const userStreaks = db.collection('user_streaks');

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const now = new Date();
    const recent = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // last 7 days

    const insertedIds = [];
    const newlyCreatedIds = [];

    for (let i = 0; i < STUDENTS.length; i++) {
      const s = STUDENTS[i];
      const uname = `student_${slug(s.section, i)}`;
      const email = `${uname}@codelab.local`;
      const fullName = [s.first, s.middle, s.last].filter(Boolean).join(' ');
      const birthday = new Date(2007, 4, (i % 28) + 1);

      const existing = await users.findOne({ $or: [{ username: uname }, { email }] });
      if (existing) {
        console.log(`Skip existing: ${uname}`);
        insertedIds.push(existing._id.toString());
        continue;
      }

      const doc = {
        full_name: fullName,
        last_name: s.last,
        first_name: s.first,
        middle_name: s.middle || '',
        username: uname,
        email,
        grade: s.grade,
        strand: s.strand,
        section: s.section,
        contact: `09${String(100000000 + i).slice(-9)}`,
        birthday,
        age: 17,
        sex: i % 2 === 0 ? 'Male' : 'Female',
        address: `${i + 1} Sample St, Barangay Test`,
        password: hashedPassword,
        role: 'student',
        created_at: now,
      };
      const result = await users.insertOne(doc);
      const userId = result.insertedId.toString();
      insertedIds.push(userId);
      newlyCreatedIds.push(userId);
      console.log(`Created student: ${uname} (${s.section})`);
    }

    // Add progress and activity only for newly created students (so they have progress and show as active)
    const courses = ['HTML', 'C++', 'Python'];

    for (let si = 0; si < newlyCreatedIds.length; si++) {
      const userId = newlyCreatedIds[si];
      const progressDocs = [];
      // 2–5 lectures + quizzes per course so progress and last_updated vary (shows as active)
      const numLectures = 2 + (si % 4);
      for (const course of courses) {
        for (let lid = 1; lid <= numLectures && lid <= 6; lid++) {
          const lastUpdated = new Date(recent.getTime() + si * 60 * 60 * 1000); // spread over hours so last activity varies
          progressDocs.push(
            {
              user_id: userId,
              course,
              lecture_id: String(lid),
              type: 'lecture',
              completed: true,
              score: 0,
              last_updated: lastUpdated,
            },
            {
              user_id: userId,
              course,
              lecture_id: String(lid),
              type: 'quiz',
              completed: true,
              score: 8 + (si % 3),
              total: 10,
              last_updated: lastUpdated,
            }
          );
        }
      }
      if (progressDocs.length > 0) {
        await userProgress.insertMany(progressDocs);
      }
      // Streak so they have last_activity_date (active)
      const today = now.toISOString().split('T')[0];
      await userStreaks.updateOne(
        { user_id: userId },
        {
          $set: {
            user_id: userId,
            current_streak: 1 + (si % 5),
            longest_streak: 2 + (si % 6),
            last_activity_date: today,
            total_days_active: 3 + (si % 10),
            updated_at: now,
            created_at: now,
          },
        },
        { upsert: true }
      );
    }

    console.log(`\nDone. ${insertedIds.length} students seeded (Secret + Galileo) with progress and activity.`);
    console.log('Default password for all:', DEFAULT_PASSWORD);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
