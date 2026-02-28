const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
// Allow larger payloads for profile photo (base64); 500KB image ≈ 670KB in JSON
app.use(express.json({ limit: '2mb' }));
app.use(cors());

// MongoDB: use MONGODB_URI or DATABASE_URL (e.g. from Atlas)
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
let db = null;
let users = null;
let userProgress = null;
let userStreaks = null;
let userAchievements = null;
let userStats = null;
let announcements = null;
let teacherNotes = null;

async function connectDb() {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI or DATABASE_URL in .env');
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();
  users = db.collection('users');
  userProgress = db.collection('user_progress');
  userStreaks = db.collection('user_streaks');
  userAchievements = db.collection('user_achievements');
  userStats = db.collection('user_stats');
  announcements = db.collection('announcements');
  teacherNotes = db.collection('teacher_notes');
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ username: 1 }, { unique: true });
  await userProgress.createIndex(
    { user_id: 1, course: 1, lecture_id: 1, type: 1 },
    { unique: true }
  );
  await userStreaks.createIndex({ user_id: 1 }, { unique: true });
  await userAchievements.createIndex(
    { user_id: 1, key: 1 },
    { unique: true }
  );
  await userStats.createIndex({ user_id: 1 }, { unique: true });
  await teacherNotes.createIndex({ student_id: 1 }, { unique: true });
  await users.createIndex({ employee_number: 1 }, { unique: true, sparse: true });
  console.log('Connected to MongoDB');
}

// Initialize database
connectDb().catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { fullName, lastName, firstName, middleName, username, contact, birthday, age, sex, grade, strand, section, address, email, password, role, employeeNumber } = req.body;

    const normalizedRole = (role || 'student').toLowerCase() === 'teacher' ? 'teacher' : 'student';

    // Teachers only need: fullName, username, email, password, employee number (7 digits). Rest optional.
    if (normalizedRole === 'teacher') {
      if (!fullName || !username || !email || !password) {
        return res.status(400).json({ message: 'Please enter full name, username, email, and password' });
      }
      const rawEmp = (employeeNumber || '').toString().replace(/\D/g, '');
      if (!rawEmp || rawEmp.length !== 7) {
        return res.status(400).json({ message: 'Employee number must be exactly 7 digits.' });
      }
    } else {
      // Students: require Last Name, First Name (Middle Name optional)
      const ln = (lastName || '').toString().trim();
      const fn = (firstName || '').toString().trim();
      const mn = (middleName || '').toString().trim();
      if (!ln || !fn) {
        return res.status(400).json({ message: 'Please enter Last Name and First Name' });
      }
      if (!username || !birthday || !age || !sex || !grade || !strand || !section || !address || !email || !password || !contact) {
        return res.status(400).json({ message: 'Please enter all required fields' });
      }
    }

    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'A user with this email already exists. Please log in instead.' });
    }

    const existingUsername = await users.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'This username is already taken. Please choose a different username.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedContact = contact ? String(contact).trim() : '';
    const normalizedEmployeeNumber = normalizedRole === 'teacher'
      ? (employeeNumber ? employeeNumber.toString().replace(/\D/g, '').slice(0, 7) : '')
      : '';

    // Build full_name: for students use lastName, firstName, middleName; for teachers use fullName
    const resolvedFullName = normalizedRole === 'teacher'
      ? (fullName || '').trim()
      : [firstName, middleName, lastName].map((x) => (x || '').toString().trim()).filter(Boolean).join(' ');

    const doc = {
      full_name: resolvedFullName,
      username,
      last_name: normalizedRole === 'student' ? (lastName || '').toString().trim() : undefined,
      first_name: normalizedRole === 'student' ? (firstName || '').toString().trim() : undefined,
      middle_name: normalizedRole === 'student' ? (middleName || '').toString().trim() : undefined,
      birthday: normalizedRole === 'teacher' ? (birthday ? new Date(birthday) : null) : new Date(birthday),
      age: normalizedRole === 'teacher' ? (age != null && age !== '' ? Number(age) : null) : Number(age),
      sex: normalizedRole === 'teacher' ? (sex || '') : sex,
      grade: normalizedRole === 'teacher' ? (grade || '') : grade,
      strand: normalizedRole === 'teacher' ? (strand || '') : strand,
      section: normalizedRole === 'teacher' ? (section || '') : section,
      address: normalizedRole === 'teacher' ? (address || '') : address,
      contact: normalizedRole === 'teacher' ? '' : normalizedContact,
      employee_number: normalizedRole === 'teacher' ? normalizedEmployeeNumber : '',
      email,
      password: hashedPassword,
      role: normalizedRole,
      created_at: new Date(),
    };
    const result = await users.insertOne(doc);
    const id = result.insertedId.toString();

    res.status(201).json({
      message: 'User registered successfully',
      user: { id, email, username, role: normalizedRole },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const id = user._id.toString();
    const token = jwt.sign(
      { id, email: user.email, username: user.username, role: user.role || 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const birthdayVal = user.birthday;
    res.status(200).json({
      token,
      message: 'Logged in successfully',
      user: {
        id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        lastName: user.last_name || '',
        firstName: user.first_name || '',
        middleName: user.middle_name || '',
        role: user.role || 'student',
        profilePhoto: user.profile_photo || null,
        birthday: birthdayVal ? (birthdayVal instanceof Date ? birthdayVal.toISOString().slice(0, 10) : String(birthdayVal).slice(0, 10)) : '',
        age: user.age != null ? user.age : '',
        sex: user.sex || '',
        address: user.address || '',
        grade: user.grade || '',
        strand: user.strand || '',
        section: user.section || '',
        contact: user.contact || '',
        employeeNumber: user.employee_number || '',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (photo + editable signup info) – for students
app.patch('/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const body = req.body || {};
    const {
      profilePhoto,
      fullName,
      lastName,
      firstName,
      middleName,
      username,
      birthday,
      age,
      sex,
      address,
      grade,
      strand,
      section,
      email,
      contact,
    } = body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }
    let id;
    try {
      id = new ObjectId(userId);
    } catch {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const update = {};
    if (typeof profilePhoto === 'string') update.profile_photo = profilePhoto;
    if (profilePhoto === null || profilePhoto === '') update.profile_photo = null;
    // Name: accept lastName/firstName/middleName from body (so profile save always persists name)
    if (lastName !== undefined || firstName !== undefined || middleName !== undefined) {
      const ln = (lastName != null ? String(lastName) : '').trim();
      const fn = (firstName != null ? String(firstName) : '').trim();
      const mn = (middleName != null ? String(middleName) : '').trim();
      update.full_name = [fn, mn, ln].filter(Boolean).join(' ');
      update.last_name = ln;
      update.first_name = fn;
      update.middle_name = mn;
    } else if (typeof fullName === 'string' && fullName.trim()) {
      update.full_name = fullName.trim();
    }
    if (typeof username === 'string' && username.trim()) {
      const existing = await users.findOne({ username: username.trim(), _id: { $ne: id } });
      if (existing) return res.status(400).json({ message: 'This username is already taken.' });
      update.username = username.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      const existing = await users.findOne({ email: email.trim(), _id: { $ne: id } });
      if (existing) return res.status(400).json({ message: 'A user with this email already exists.' });
      update.email = email.trim();
    }
    if (birthday !== undefined) update.birthday = birthday ? new Date(birthday) : null;
    if (age !== undefined) update.age = age !== '' && age != null ? Number(age) : null;
    if (typeof sex === 'string') update.sex = sex;
    if (typeof address === 'string') update.address = address;
    if (typeof contact === 'string') update.contact = contact;
    if (typeof grade === 'string') update.grade = grade;
    if (typeof strand === 'string') update.strand = strand;
    if (typeof section === 'string') update.section = section;
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    const u = await users.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { returnDocument: 'after' }
    );
    if (!u) {
      return res.status(404).json({ message: 'User not found' });
    }
    const birthdayVal = u.birthday;
    res.status(200).json({
      message: 'Profile updated',
      user: {
        id: u._id.toString(),
        email: u.email,
        username: u.username,
        fullName: u.full_name,
        lastName: u.last_name || '',
        firstName: u.first_name || '',
        middleName: u.middle_name || '',
        role: u.role || 'student',
        profilePhoto: u.profile_photo || null,
        birthday: birthdayVal ? (birthdayVal instanceof Date ? birthdayVal.toISOString().slice(0, 10) : String(birthdayVal).slice(0, 10)) : '',
        age: u.age != null ? u.age : '',
        sex: u.sex || '',
        address: u.address || '',
        grade: u.grade || '',
        strand: u.strand || '',
        section: u.section || '',
        contact: u.contact || '',
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Forgot password
app.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body || {};

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await users.updateOne({ email }, { $set: { password: hashedPassword } });

    return res.status(200).json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    const msg = error.message || error.code || String(error) || 'Failed to update password';
    return res.status(500).json({ error: msg, message: msg });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// Progress: get by user
app.get('/progress/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const cursor = userProgress.find({ user_id: userId }).sort({ last_updated: -1 });
    const progress = await cursor.toArray();
    res.status(200).json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Progress: upsert
app.post('/progress', async (req, res) => {
  try {
    const { userId, course, lectureId, type, completed, score, total } = req.body;

    if (!userId || !course || !lectureId || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const filter = {
      user_id: userId,
      course,
      lecture_id: String(lectureId),
      type,
    };
    const setFields = {
      completed: !!completed,
      score: score ?? 0,
      last_updated: new Date(),
    };
    if (type === 'quiz') setFields.total = total ?? 0;
    const update = { $set: setFields };
    const result = await userProgress.findOneAndUpdate(
      filter,
      update,
      { upsert: true, returnDocument: 'after' }
    );
    const progress = result || (await userProgress.findOne(filter));

    if (completed) {
      await updateUserStreak(userId);
    }

    let achievementAwarded = null;
    const award = async (key) => {
      const res = await userAchievements.updateOne(
        { user_id: userId, key },
        { $setOnInsert: { user_id: userId, key, created_at: new Date() } },
        { upsert: true }
      );
      if (res.upsertedCount === 1 && !achievementAwarded) achievementAwarded = { key };
    };
    try {
      if (type === 'quiz' && completed && typeof score === 'number' && typeof total === 'number' && total > 0 && score === total) {
        const count = await userProgress.countDocuments({
          user_id: userId,
          course,
          lecture_id: String(lectureId),
          type: 'quiz',
          completed: true,
        });
        if (count === 1) {
          await award(`perfect_first_try:${course}:${lectureId}`);
        }
      }
      // Course complete: all 6 quizzes done for this course
      if (type === 'quiz' && completed && (course === 'HTML' || course === 'C++' || course === 'Python')) {
        const quizCount = await userProgress.countDocuments({
          user_id: userId,
          course,
          type: 'quiz',
          completed: true,
        });
        if (quizCount >= 6) await award(`course_complete:${course}`);
      }
      // Streak milestones (check after updateUserStreak)
      const streakDoc = await userStreaks.findOne({ user_id: userId });
      const currentStreak = streakDoc?.current_streak ?? 0;
      if (currentStreak >= 7) await award('streak:7');
      else if (currentStreak >= 3) await award('streak:3');
    } catch (e) {
      console.error('Achievement check error:', e);
    }

    res.status(200).json({
      message: 'Progress updated successfully',
      progress,
      ...(achievementAwarded && { achievementAwarded }),
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Achievements
app.get('/achievements/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const cursor = userAchievements.find({ user_id: userId }).sort({ created_at: -1 });
    const rows = await cursor.toArray();
    const achievements = rows.map((r) => ({ key: r.key, created_at: r.created_at }));
    res.status(200).json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Award an achievement (e.g. when user passes a challenge)
app.post('/achievements', async (req, res) => {
  try {
    const { userId, key } = req.body;
    if (!userId || !key) {
      return res.status(400).json({ message: 'Missing userId or key' });
    }
    await userAchievements.updateOne(
      { user_id: userId, key },
      { $setOnInsert: { user_id: userId, key, created_at: new Date() } },
      { upsert: true }
    );
    res.status(200).json({ message: 'Achievement recorded' });
  } catch (error) {
    console.error('Award achievement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User stats (code lines written, challenges completed)
app.get('/stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const statsDoc = await userStats.findOne({ user_id: userId });
    const codeLinesWritten = statsDoc?.total_lines_written ?? 0;
    const challengeCount = await userAchievements.countDocuments({
      user_id: userId,
      key: { $regex: /^challenge:/ }
    });
    res.status(200).json({
      code_lines_written: codeLinesWritten,
      challenges_completed: challengeCount
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/stats/:userId/lines', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { linesToAdd } = req.body;
    const toAdd = Math.max(0, Math.floor(Number(linesToAdd) || 0));
    if (toAdd === 0) {
      return res.status(200).json({ message: 'No lines to add' });
    }
    await userStats.updateOne(
      { user_id: userId },
      { $inc: { total_lines_written: toAdd }, $set: { last_updated: new Date() } },
      { upsert: true }
    );
    const doc = await userStats.findOne({ user_id: userId });
    res.status(200).json({
      code_lines_written: doc?.total_lines_written ?? toAdd
    });
  } catch (error) {
    console.error('Add lines error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Class summary for teacher (total students, average progress, students with progress)
function overallProgressFromItems(items) {
  const courses = ['HTML', 'C++', 'Python'];
  const lectureIds = [1, 2, 3, 4, 5, 6];
  const totalPerCourse = 6;
  let totalPct = 0;
  for (const course of courses) {
    let fullyComplete = 0;
    for (const id of lectureIds) {
      const lectureDone = items.some(
        (p) => p.course === course && String(p.lecture_id) === String(id) && p.type === 'lecture' && p.completed,
      );
      const quizDone = items.some(
        (p) => p.course === course && String(p.lecture_id) === String(id) && p.type === 'quiz' && p.completed,
      );
      if (lectureDone && quizDone) fullyComplete++;
    }
    totalPct += totalPerCourse > 0 ? Math.round((fullyComplete / totalPerCourse) * 100) : 0;
  }
  return courses.length > 0 ? Math.round(totalPct / courses.length) : 0;
}

app.get('/teacher/class-summary', async (req, res) => {
  try {
    const studentRows = await users.find({ role: 'student' }).project({ _id: 1 }).toArray();
    const studentIds = studentRows.map((r) => r._id.toString());
    const totalStudents = studentIds.length;
    if (totalStudents === 0) {
      return res.status(200).json({ totalStudents: 0, averageProgress: 0, studentsWithProgress: 0 });
    }
    const allProgress = await userProgress.find({ user_id: { $in: studentIds } }).toArray();
    const byUser = {};
    for (const p of allProgress) {
      if (!byUser[p.user_id]) byUser[p.user_id] = [];
      byUser[p.user_id].push(p);
    }
    let sumProgress = 0;
    let studentsWithProgress = 0;
    for (const uid of studentIds) {
      const items = byUser[uid] || [];
      const overall = overallProgressFromItems(items);
      sumProgress += overall;
      if (items.length > 0) studentsWithProgress++;
    }
    const averageProgress = Math.round(sumProgress / totalStudents);
    res.status(200).json({ totalStudents, averageProgress, studentsWithProgress });
  } catch (error) {
    console.error('Class summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

function perCourseProgressFromItems(items) {
  const courses = ['HTML', 'C++', 'Python'];
  const lectureIds = [1, 2, 3, 4, 5, 6];
  const totalPerCourse = 6;
  const out = {};
  for (const course of courses) {
    let fullyComplete = 0;
    for (const id of lectureIds) {
      const lectureDone = items.some(
        (p) => p.course === course && String(p.lecture_id) === String(id) && p.type === 'lecture' && p.completed,
      );
      const quizDone = items.some(
        (p) => p.course === course && String(p.lecture_id) === String(id) && p.type === 'quiz' && p.completed,
      );
      if (lectureDone && quizDone) fullyComplete++;
    }
    out[course] = totalPerCourse > 0 ? Math.round((fullyComplete / totalPerCourse) * 100) : 0;
  }
  return out;
}

// Class detail: students with overall progress, per-course progress, and last activity (for export, alerts, last active)
app.get('/teacher/class-detail', async (req, res) => {
  try {
    const studentRows = await users.find({ role: 'student' }).project({
      _id: 1, full_name: 1, last_name: 1, first_name: 1, middle_name: 1, username: 1, email: 1, grade: 1, strand: 1, section: 1, profile_photo: 1,
    }).sort({ created_at: -1 }).toArray();
    const studentIds = studentRows.map((r) => r._id.toString());
    if (studentIds.length === 0) {
      return res.status(200).json({ students: [] });
    }
    const allProgress = await userProgress.find({ user_id: { $in: studentIds } }).toArray();
    const lastActivityAgg = await userProgress.aggregate([
      { $match: { user_id: { $in: studentIds } } },
      { $group: { _id: '$user_id', last: { $max: '$last_updated' } } },
    ]).toArray();
    const lastByUser = {};
    for (const row of lastActivityAgg) {
      lastByUser[row._id] = row.last;
    }
    const byUser = {};
    for (const p of allProgress) {
      if (!byUser[p.user_id]) byUser[p.user_id] = [];
      byUser[p.user_id].push(p);
    }
    const students = studentRows.map((r) => {
      const id = r._id.toString();
      const items = byUser[id] || [];
      const overall = overallProgressFromItems(items);
      const courses = perCourseProgressFromItems(items);
      const last = lastByUser[id];
      return {
        id,
        full_name: r.full_name,
        last_name: r.last_name || '',
        first_name: r.first_name || '',
        middle_name: r.middle_name || '',
        username: r.username,
        email: r.email,
        grade: r.grade,
        strand: r.strand,
        section: r.section,
        profile_photo: r.profile_photo || null,
        overallProgress: overall,
        htmlProgress: courses['HTML'],
        cppProgress: courses['C++'],
        pythonProgress: courses['Python'],
        lastActivity: last ? last.toISOString() : null,
      };
    });
    res.status(200).json({ students });
  } catch (error) {
    console.error('Class detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export progress as CSV (same data as class-detail, returned as CSV)
app.get('/teacher/export-progress', async (req, res) => {
  try {
    const studentRows = await users.find({ role: 'student' }).project({
      _id: 1, full_name: 1, username: 1, email: 1, grade: 1, strand: 1, section: 1,
    }).toArray();
    const studentIds = studentRows.map((r) => r._id.toString());
    const allProgress = studentIds.length > 0
      ? await userProgress.find({ user_id: { $in: studentIds } }).toArray()
      : [];
    const byUser = {};
    for (const p of allProgress) {
      if (!byUser[p.user_id]) byUser[p.user_id] = [];
      byUser[p.user_id].push(p);
    }
    const lastAgg = await userProgress.aggregate([
      { $match: { user_id: { $in: studentIds } } },
      { $group: { _id: '$user_id', last: { $max: '$last_updated' } } },
    ]).toArray();
    const lastByUser = {};
    for (const row of lastAgg) lastByUser[row._id] = row.last;
    const rows = studentRows.map((r) => {
      const id = r._id.toString();
      const items = byUser[id] || [];
      const courses = perCourseProgressFromItems(items);
      return {
        full_name: r.full_name,
        username: r.username,
        email: r.email,
        grade: r.grade,
        strand: r.strand,
        section: r.section,
        overallProgress: overallProgressFromItems(items),
        htmlProgress: courses['HTML'],
        cppProgress: courses['C++'],
        pythonProgress: courses['Python'],
        lastActivity: lastByUser[id] ? lastByUser[id].toISOString() : '',
      };
    });
    const escape = (v) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = 'Name,Username,Email,Grade,Strand,Section,Overall %,HTML %,C++ %,Python %,Last activity';
    const csvLines = [header, ...rows.map((s) => [
      escape(s.full_name || s.username),
      escape(s.username),
      escape(s.email),
      escape(s.grade),
      escape(s.strand),
      escape(s.section),
      s.overallProgress ?? '',
      s.htmlProgress ?? '',
      s.cppProgress ?? '',
      s.pythonProgress ?? '',
      s.lastActivity ?? '',
    ].join(','))];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="codelab-progress.csv"');
    res.send('\uFEFF' + csvLines.join('\n'));
  } catch (error) {
    console.error('Export progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Announcements: list (for students) and create (for teacher)
app.get('/teacher/announcements', async (req, res) => {
  try {
    if (!announcements) {
      return res.status(503).json({ message: 'Announcements not available. Ensure the server has restarted after the latest update.' });
    }
    const list = await announcements
      .find({})
      .sort({ pinned: -1, publish_at: -1, created_at: -1 })
      .limit(50)
      .toArray();
    res.status(200).json({
      announcements: list.map((a) => ({
        id: a._id.toString(),
        text: a.text,
        created_at: a.created_at,
        pinned: !!a.pinned,
        publish_at: a.publish_at || null,
        target: a.target || null,
      })),
    });
  } catch (error) {
    console.error('Get teacher announcements error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/announcements', async (req, res) => {
  try {
    const grade = req.query.grade ? String(req.query.grade) : '';
    const strand = req.query.strand ? String(req.query.strand) : '';
    const section = req.query.section ? String(req.query.section) : '';

    const now = new Date();
    const timeFilter = {
      $or: [
        { publish_at: { $exists: false } },
        { publish_at: null },
        { publish_at: { $lte: now } },
      ],
    };

    // Targeting logic:
    // - No target => visible to everyone
    // - Target fields are treated as optional constraints:
    //   If a target field exists, it must match the student's value.
    //   If it doesn't exist, it's a wildcard.
    const matchKey = (key, value) => (
      value
        ? { $or: [{ [`target.${key}`]: value }, { [`target.${key}`]: { $exists: false } }, { [`target.${key}`]: '' }, { [`target.${key}`]: null }] }
        : { $or: [{ [`target.${key}`]: { $exists: false } }, { [`target.${key}`]: '' }, { [`target.${key}`]: null }] }
    );
    const audienceFilter = {
      $or: [
        { target: { $exists: false } },
        { target: null },
        { $and: [matchKey('grade', grade), matchKey('strand', strand), matchKey('section', section)] },
      ],
    };

    const filter = { $and: [timeFilter, audienceFilter] };

    const list = await announcements
      .find(filter)
      .sort({ pinned: -1, publish_at: -1, created_at: -1 })
      .limit(10)
      .toArray();

    res.status(200).json({
      announcements: list.map((a) => ({
        id: a._id.toString(),
        text: a.text,
        created_at: a.created_at,
        pinned: !!a.pinned,
        publish_at: a.publish_at || null,
        target: a.target || null,
      })),
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/announcements', async (req, res) => {
  try {
    if (!announcements) {
      return res.status(503).json({ message: 'Announcements not available. Ensure the server has restarted after the latest update.' });
    }
    const { text, pinned, publish_at, target } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Announcement text is required.' });
    }
    const publishAt = publish_at ? new Date(publish_at) : null;
    const safeTarget = target && typeof target === 'object'
      ? {
          ...(target.grade ? { grade: String(target.grade) } : {}),
          ...(target.strand ? { strand: String(target.strand) } : {}),
          ...(target.section ? { section: String(target.section) } : {}),
        }
      : null;
    const result = await announcements.insertOne({
      text: text.trim(),
      created_at: new Date(),
      pinned: !!pinned,
      publish_at: publishAt && !Number.isNaN(publishAt.getTime()) ? publishAt : null,
      target: safeTarget && Object.keys(safeTarget).length > 0 ? safeTarget : null,
    });
    res.status(201).json({
      id: result.insertedId.toString(),
      text: text.trim(),
      created_at: new Date(),
      pinned: !!pinned,
      publish_at: publishAt && !Number.isNaN(publishAt.getTime()) ? publishAt : null,
      target: safeTarget && Object.keys(safeTarget).length > 0 ? safeTarget : null,
    });
  } catch (error) {
    console.error('Post announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Edit announcement (teacher)
app.patch('/announcements/:id', async (req, res) => {
  try {
    if (!announcements) {
      return res.status(503).json({ message: 'Announcements not available. Ensure the server has restarted after the latest update.' });
    }
    const { id } = req.params;
    const { text, pinned, publish_at, target } = req.body || {};
    if (!id) return res.status(400).json({ message: 'Missing announcement id.' });
    const set = {};
    if (typeof text === 'string' && text.trim()) set.text = text.trim();
    if (typeof pinned === 'boolean') set.pinned = pinned;
    if (publish_at !== undefined) {
      const d = publish_at ? new Date(publish_at) : null;
      set.publish_at = d && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (target !== undefined) {
      const safeTarget = target && typeof target === 'object'
        ? {
            ...(target.grade ? { grade: String(target.grade) } : {}),
            ...(target.strand ? { strand: String(target.strand) } : {}),
            ...(target.section ? { section: String(target.section) } : {}),
          }
        : null;
      set.target = safeTarget && Object.keys(safeTarget).length > 0 ? safeTarget : null;
    }
    if (Object.keys(set).length === 0) {
      return res.status(400).json({ message: 'Nothing to update.' });
    }
    const _id = new ObjectId(id);
    const updated = await announcements.findOneAndUpdate(
      { _id },
      { $set: set },
      { returnDocument: 'after' },
    );
    const doc = updated && updated.value ? updated.value : null;
    if (!doc) return res.status(404).json({ message: 'Announcement not found.' });
    res.status(200).json({
      id: doc._id.toString(),
      text: doc.text,
      created_at: doc.created_at,
      pinned: !!doc.pinned,
      publish_at: doc.publish_at || null,
      target: doc.target || null,
    });
  } catch (error) {
    console.error('Edit announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete announcement (teacher)
app.delete('/announcements/:id', async (req, res) => {
  try {
    if (!announcements) {
      return res.status(503).json({ message: 'Announcements not available. Ensure the server has restarted after the latest update.' });
    }
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Missing announcement id.' });
    const _id = new ObjectId(id);
    const result = await announcements.deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Announcement not found.' });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teacher notes per student (simple, single note per student)
app.get('/teacher/notes/:studentId', async (req, res) => {
  try {
    if (!teacherNotes) return res.status(503).json({ message: 'Notes not available. Ensure the server has restarted.' });
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ message: 'Missing student id.' });
    const doc = await teacherNotes.findOne({ student_id: studentId });
    res.status(200).json({ studentId, text: doc?.text || '', updated_at: doc?.updated_at || null });
  } catch (error) {
    console.error('Get teacher note error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/teacher/notes/:studentId', async (req, res) => {
  try {
    if (!teacherNotes) return res.status(503).json({ message: 'Notes not available. Ensure the server has restarted.' });
    const { studentId } = req.params;
    const { text } = req.body || {};
    if (!studentId) return res.status(400).json({ message: 'Missing student id.' });
    if (text != null && typeof text !== 'string') return res.status(400).json({ message: 'Invalid note text.' });
    const payload = { text: (text || '').slice(0, 4000), updated_at: new Date() };
    await teacherNotes.updateOne(
      { student_id: studentId },
      { $set: payload, $setOnInsert: { student_id: studentId, created_at: new Date() } },
      { upsert: true },
    );
    res.status(200).json({ studentId, ...payload });
  } catch (error) {
    console.error('Save teacher note error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lecture completion counts per course (for analytics: most/least completed)
app.get('/teacher/lecture-analytics', async (req, res) => {
  try {
    const studentIds = (await users.find({ role: 'student' }).project({ _id: 1 }).toArray()).map((r) => r._id.toString());
    if (studentIds.length === 0) {
      return res.status(200).json({ HTML: {}, 'C++': {}, Python: {} });
    }
    const completed = await userProgress.find({
      user_id: { $in: studentIds },
      type: 'lecture',
      completed: true,
    }).toArray();
    const byCourse = { HTML: {}, 'C++': {}, Python: {} };
    const lectureIds = [1, 2, 3, 4, 5, 6];
    for (const c of ['HTML', 'C++', 'Python']) {
      for (const lid of lectureIds) {
        byCourse[c][String(lid)] = completed.filter(
          (p) => p.course === c && String(p.lecture_id) === String(lid),
        ).length;
      }
    }
    res.status(200).json(byCourse);
  } catch (error) {
    console.error('Lecture analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Students (teacher view)
app.get('/students', async (req, res) => {
  try {
    const cursor = users
      .find({ role: 'student' })
      .project({ full_name: 1, last_name: 1, first_name: 1, middle_name: 1, username: 1, email: 1, grade: 1, strand: 1, section: 1, created_at: 1, profile_photo: 1 })
      .sort({ created_at: -1 });
    const rows = await cursor.toArray();
    const students = rows.map((r) => ({
      id: r._id.toString(),
      full_name: r.full_name,
      last_name: r.last_name || '',
      first_name: r.first_name || '',
      middle_name: r.middle_name || '',
      username: r.username,
      email: r.email,
      grade: r.grade,
      strand: r.strand,
      section: r.section,
      created_at: r.created_at,
      profile_photo: r.profile_photo || null,
    }));
    res.status(200).json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streak: get
app.get('/streak/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    let streak = await userStreaks.findOne({ user_id: userId });
    if (!streak) {
      await userStreaks.insertOne({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        total_days_active: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
      streak = await userStreaks.findOne({ user_id: userId });
    }
    res.status(200).json({ streak });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streak: tick
app.post('/streak/:userId/tick', async (req, res) => {
  try {
    const userId = req.params.userId;
    await updateUserStreak(userId);
    const streak = await userStreaks.findOne({ user_id: userId });
    let achievementAwarded = null;
    const currentStreak = streak?.current_streak ?? 0;
    if (currentStreak >= 7) {
      const r = await userAchievements.updateOne(
        { user_id: userId, key: 'streak:7' },
        { $setOnInsert: { user_id: userId, key: 'streak:7', created_at: new Date() } },
        { upsert: true }
      );
      if (r.upsertedCount === 1) achievementAwarded = { key: 'streak:7' };
    }
    if (!achievementAwarded && currentStreak >= 3) {
      const r = await userAchievements.updateOne(
        { user_id: userId, key: 'streak:3' },
        { $setOnInsert: { user_id: userId, key: 'streak:3', created_at: new Date() } },
        { upsert: true }
      );
      if (r.upsertedCount === 1) achievementAwarded = { key: 'streak:3' };
    }
    return res.status(200).json({ streak, ...(achievementAwarded && { achievementAwarded }) });
  } catch (error) {
    console.error('Tick streak error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function updateUserStreak(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    let streak = await userStreaks.findOne({ user_id: userId });

    if (!streak) {
      await userStreaks.insertOne({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        total_days_active: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return;
    }

    const lastActivity = streak.last_activity_date
      ? (streak.last_activity_date instanceof Date
          ? streak.last_activity_date.toISOString().split('T')[0]
          : String(streak.last_activity_date))
      : null;

    let newStreak = streak.current_streak;
    let newTotalDays = streak.total_days_active;

    if (!lastActivity) {
      newStreak = 1;
      newTotalDays = 1;
    } else {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffDays = Math.ceil((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = streak.current_streak + 1;
        newTotalDays = streak.total_days_active + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
        newTotalDays = streak.total_days_active + 1;
      }
    }

    const newLongestStreak = Math.max(newStreak, streak.longest_streak || 0);
    await userStreaks.updateOne(
      { user_id: userId },
      {
        $set: {
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_activity_date: today,
          total_days_active: newTotalDays,
          updated_at: new Date(),
        },
      }
    );
  } catch (error) {
    console.error('Update streak error:', error);
  }
}

// Delete student (teacher): remove student and all related data from DB
app.delete('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'User id required' });
    let oid;
    try {
      oid = new ObjectId(id);
    } catch {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await users.findOne({ _id: oid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if ((user.role || 'student').toLowerCase() !== 'student') {
      return res.status(403).json({ message: 'Only students can be deleted from this endpoint' });
    }
    const userId = id;
    await Promise.all([
      users.deleteOne({ _id: oid }),
      userProgress.deleteMany({ user_id: userId }),
      userStreaks.deleteMany({ user_id: userId }),
      userAchievements.deleteMany({ user_id: userId }),
      userStats.deleteMany({ user_id: userId }),
      teacherNotes.deleteMany({ student_id: userId }),
    ]);
    res.status(200).json({ message: 'Student deleted successfully', id: userId });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user (testing)
app.delete('/delete-user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const result = await users.findOneAndDelete({ email });
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User deleted successfully',
      deletedUser: email,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Code execution: Judge0 CE by default (set JUDGE0_API_URL in .env to override; optional JUDGE0_AUTH_TOKEN)
const JUDGE0_BASE = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
const JUDGE0_AUTH = process.env.JUDGE0_AUTH_TOKEN || '';

app.get('/run/status', (req, res) => {
  res.json({ runner: 'judge0', base: JUDGE0_BASE ? 'configured' : 'missing' });
});

const mapLanguageToJudge0Id = (lang) => {
  const lower = String(lang || '').toLowerCase();
  if (lower === 'c++' || lower === 'cpp' || lower === 'cxx') return 54;  // C++ (GCC 9.4)
  if (lower === 'python' || lower === 'py') return 71;                    // Python 3
  return null;
};

app.post('/run', async (req, res) => {
  try {
    const { language, code, testInput } = req.body || {};
    if (!language || typeof code !== 'string') {
      return res.status(400).json({ error: 'language and code are required' });
    }
    const langLower = String(language).toLowerCase();
    if (langLower === 'html') {
      return res.status(400).json({ error: 'HTML is previewed client-side, not executed' });
    }
    const languageId = mapLanguageToJudge0Id(language);
    if (languageId == null) {
      return res.status(400).json({ error: `Unsupported language: ${language}. Use C++ or Python.` });
    }
    const payload = {
      source_code: code,
      language_id: languageId,
      stdin: typeof testInput === 'string' ? testInput : undefined,
    };
    const headers = { 'Content-Type': 'application/json' };
    if (JUDGE0_AUTH) headers['X-Auth-Token'] = JUDGE0_AUTH;
    const execResp = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const result = await execResp.json();
    if (!execResp.ok) {
      const errMsg = result?.error || result?.message || 'Code execution service unavailable. Try again in a moment.';
      return res.status(execResp.status).json({ error: errMsg, ...result });
    }
    const statusId = result?.status?.id;
    const stdout = result?.stdout || '';
    const stderr = result?.stderr || '';
    const compileOutput = result?.compile_output || '';
    const message = result?.message || '';
    const accepted = statusId === 3;
    let output = (stdout + (stderr ? (stdout ? '\n' : '') + stderr : '')).trim();
    if (!accepted && (compileOutput || message)) {
      output = (output ? output + '\n\n' : '') + (compileOutput || message);
    }
    res.status(200).json({ output: output || (accepted ? '' : (message || 'Execution failed.')), raw: result });
  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({ error: error.message || 'Server error while running code.' });
  }
});
