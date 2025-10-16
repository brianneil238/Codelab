require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Create users table if it doesn't exist
const createUsersTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        birthday DATE NOT NULL,
        age INTEGER NOT NULL,
        sex VARCHAR(10) NOT NULL,
        grade VARCHAR(50) NOT NULL,
        strand VARCHAR(100) NOT NULL,
        section VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('Users table created or already exists');
  } catch (error) {
    console.error('Error creating users table:', error);
  }
};

// Create progress table if it doesn't exist
const createProgressTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course VARCHAR(50) NOT NULL,
        lecture_id VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('lecture', 'quiz')),
        completed BOOLEAN DEFAULT FALSE,
        score INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course, lecture_id, type)
      )
    `;
    await pool.query(query);
    console.log('Progress table created or already exists');
  } catch (error) {
    console.error('Error creating progress table:', error);
  }
};

// Create streak table if it doesn't exist
const createStreakTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS user_streaks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_activity_date DATE,
        total_days_active INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;
    await pool.query(query);
    console.log('Streak table created or already exists');
  } catch (error) {
    console.error('Error creating streak table:', error);
  }
};

// Achievements table
const createAchievementsTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        key VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, key)
      )
    `;
    await pool.query(query);
    console.log('Achievements table created or already exists');
  } catch (error) {
    console.error('Error creating achievements table:', error);
  }
};

// Initialize database
createUsersTable();
createProgressTable();
createStreakTable();
createAchievementsTable();

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { fullName, username, birthday, age, sex, grade, strand, section, address, email, password } = req.body;

    // Validate required fields
    if (!fullName || !username || !birthday || !age || !sex || !grade || !strand || !section || !address || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user already exists
    const existingUserQuery = 'SELECT * FROM users WHERE email = $1 OR username = $2';
    const existingUser = await pool.query(existingUserQuery, [email, username]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (full_name, username, birthday, age, sex, grade, strand, section, address, email, password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, email, username
    `;
    
    const result = await pool.query(insertQuery, [
      fullName, username, birthday, age, sex, grade, strand, section, address, email, hashedPassword
    ]);

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        username: result.rows[0].username
      }
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

    // Find user by email
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(userQuery, [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        username: user.username 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      token, 
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check route for uptime monitoring and Render health checks
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// Progress routes
app.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = 'SELECT * FROM user_progress WHERE user_id = $1 ORDER BY last_updated DESC';
    const result = await pool.query(query, [userId]);
    
    res.status(200).json({ progress: result.rows });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/progress', async (req, res) => {
  try {
    const { userId, course, lectureId, type, completed, score, total } = req.body;
    
    if (!userId || !course || !lectureId || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const query = `
      INSERT INTO user_progress (user_id, course, lecture_id, type, completed, score)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, course, lecture_id, type)
      DO UPDATE SET 
        completed = EXCLUDED.completed,
        score = EXCLUDED.score,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, course, lectureId, type, completed || false, score || 0]);
    
    // Update streak when progress is made
    if (completed) {
      await updateUserStreak(userId);
    }

    // Award achievement: perfect first try for quizzes
    try {
      if (type === 'quiz' && completed && typeof score === 'number' && typeof total === 'number' && total > 0 && score === total) {
        // Check previous attempts for this quiz
        const attemptsQuery = `
          SELECT COUNT(*) AS cnt FROM user_progress
          WHERE user_id = $1 AND course = $2 AND lecture_id = $3 AND type = 'quiz' AND completed = true
        `;
        const attempts = await pool.query(attemptsQuery, [userId, course, lectureId]);
        const count = parseInt(attempts.rows[0]?.cnt || '0', 10);
        if (count === 1) {
          const key = `perfect_first_try:${course}:${lectureId}`;
          await pool.query(
            `INSERT INTO user_achievements (user_id, key) VALUES ($1, $2) ON CONFLICT (user_id, key) DO NOTHING`,
            [userId, key]
          );
        }
      }
    } catch (e) {
      console.error('Achievement check error:', e);
    }
    
    res.status(200).json({ 
      message: 'Progress updated successfully',
      progress: result.rows[0]
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List achievements for a user
app.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT key, created_at FROM user_achievements WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.status(200).json({ achievements: result.rows });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streak routes
app.get('/streak/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = 'SELECT * FROM user_streaks WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Create initial streak record
      const insertQuery = `
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_days_active)
        VALUES ($1, 0, 0, NULL, 0)
        RETURNING *
      `;
      const newResult = await pool.query(insertQuery, [userId]);
      return res.status(200).json({ streak: newResult.rows[0] });
    }
    
    res.status(200).json({ streak: result.rows[0] });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Increment/update streak explicitly (can be called on daily activity)
app.post('/streak/:userId/tick', async (req, res) => {
  try {
    const { userId } = req.params;
    await updateUserStreak(userId);
    const query = 'SELECT * FROM user_streaks WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return res.status(200).json({ streak: result.rows[0] });
  } catch (error) {
    console.error('Tick streak error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update user streak
const updateUserStreak = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get current streak
    const streakQuery = 'SELECT * FROM user_streaks WHERE user_id = $1';
    const streakResult = await pool.query(streakQuery, [userId]);
    
    if (streakResult.rows.length === 0) {
      // Create new streak record
      const insertQuery = `
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_days_active)
        VALUES ($1, 1, 1, $2, 1)
        ON CONFLICT (user_id) DO NOTHING
      `;
      await pool.query(insertQuery, [userId, today]);
    } else {
      const streak = streakResult.rows[0];
      const lastActivity = streak.last_activity_date;
      
      let newStreak = streak.current_streak;
      let newTotalDays = streak.total_days_active;
      
      if (!lastActivity) {
        // First activity
        newStreak = 1;
        newTotalDays = 1;
      } else {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          newStreak = streak.current_streak + 1;
          newTotalDays = streak.total_days_active + 1;
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
          newTotalDays = streak.total_days_active + 1;
        }
        // If diffDays === 0, same day, don't update streak
      }
      
      const newLongestStreak = Math.max(newStreak, streak.longest_streak);
      
      const updateQuery = `
        UPDATE user_streaks 
        SET current_streak = $1, longest_streak = $2, last_activity_date = $3, total_days_active = $4, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $5
      `;
      await pool.query(updateQuery, [newStreak, newLongestStreak, today, newTotalDays, userId]);
    }
  } catch (error) {
    console.error('Update streak error:', error);
  }
};

// Delete user route (for testing purposes)
app.delete('/delete-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const deleteQuery = 'DELETE FROM users WHERE email = $1 RETURNING email';
    const result = await pool.query(deleteQuery, [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'User deleted successfully',
      deletedUser: result.rows[0].email
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Code execution via Piston proxy
// Fetch latest runtimes once and cache
let pistonRuntimes = null;
const PISTON_BASE = 'https://emkc.org/api/v2/piston';

const mapLanguage = (lang) => {
  const lower = String(lang || '').toLowerCase();
  if (lower === 'c++' || lower === 'cpp' || lower === 'cxx') return 'cpp';
  if (lower === 'python' || lower === 'py') return 'python';
  return lower;
};

const getLatestVersion = async (language) => {
  if (!pistonRuntimes) {
    try {
      const resp = await fetch(`${PISTON_BASE}/runtimes`);
      pistonRuntimes = await resp.json();
    } catch (e) {
      console.error('Failed to load Piston runtimes:', e);
      pistonRuntimes = [];
    }
  }
  const langId = mapLanguage(language);
  const candidates = pistonRuntimes.filter(r => r.language === langId || (r.aliases && r.aliases.includes(langId)));
  return candidates.length ? candidates[0].version : 'latest';
};

app.post('/run', async (req, res) => {
  try {
    const { language, code } = req.body || {};
    if (!language || typeof code !== 'string') {
      return res.status(400).json({ error: 'language and code are required' });
    }
    const langId = mapLanguage(language);
    if (langId === 'html') {
      return res.status(400).json({ error: 'HTML is previewed client-side, not executed' });
    }
    const version = await getLatestVersion(langId);
    const payload = {
      language: langId,
      version,
      files: [{ name: `main.${langId === 'python' ? 'py' : (langId === 'cpp' ? 'cpp' : 'txt')}`, content: code }]
    };
    const execResp = await fetch(`${PISTON_BASE}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await execResp.json();
    if (!execResp.ok) {
      return res.status(execResp.status).json(result);
    }
    const stdout = result?.run?.stdout || '';
    const stderr = result?.run?.stderr || '';
    const output = (stdout + (stderr ? (stdout ? '\n' : '') + stderr : '')).trim();
    res.status(200).json({ output, raw: result });
  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({ error: error.message });
  }
});
