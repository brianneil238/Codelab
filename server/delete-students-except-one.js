/**
 * Delete all students except "Brian Neil Mondragon Babasa".
 * Also removes their user_progress, user_streaks, user_achievements, user_stats.
 * Run from server dir: node delete-students-except-one.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
const KEEP_FULL_NAME = 'Brian Neil Mondragon Babasa';

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
    const userAchievements = db.collection('user_achievements');
    const userStats = db.collection('user_stats');

    const keepStudent = await users.findOne({
      role: 'student',
      $or: [
        { full_name: KEEP_FULL_NAME },
        { full_name: { $regex: new RegExp(`^${KEEP_FULL_NAME.replace(/\s+/g, '\\s+')}$`, 'i') } },
      ],
    });

    if (!keepStudent) {
      console.error(`Student to keep not found: "${KEEP_FULL_NAME}". No students deleted.`);
      process.exit(1);
    }

    const keepId = keepStudent._id.toString();
    const keepIdObj = keepStudent._id;

    const toDelete = await users.find({ role: 'student', _id: { $ne: keepIdObj } }).project({ _id: 1 }).toArray();
    const idsToDelete = toDelete.map((r) => r._id.toString());

    if (idsToDelete.length === 0) {
      console.log('No other students to delete. Only Brian Neil Mondragon Babasa exists.');
      return;
    }

    const r1 = await userProgress.deleteMany({ user_id: { $in: idsToDelete } });
    const r2 = await userStreaks.deleteMany({ user_id: { $in: idsToDelete } });
    const r3 = await userAchievements.deleteMany({ user_id: { $in: idsToDelete } });
    const r4 = await userStats.deleteMany({ user_id: { $in: idsToDelete } });
    const r5 = await users.deleteMany({ role: 'student', _id: { $ne: keepIdObj } });

    console.log(`Kept student: ${KEEP_FULL_NAME} (${keepId})`);
    console.log(`Deleted ${r5.deletedCount} student(s) from users`);
    console.log(`Deleted ${r1.deletedCount} user_progress, ${r2.deletedCount} user_streaks, ${r3.deletedCount} user_achievements, ${r4.deletedCount} user_stats`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
