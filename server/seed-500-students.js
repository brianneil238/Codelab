/**
 * Seed 500 students with random grade/section and working progress + activity.
 * Run from server dir: node seed-500-students.js
 * Requires MONGODB_URI or DATABASE_URL in .env
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
const DEFAULT_PASSWORD = 'Student123!';
const TOTAL = 500;

const GRADES = ['11', '12'];
const STRANDS = ['STEM', 'ABM', 'HUMSS', 'TVL'];
const SECTION_BY_GRADE_STRAND = {
  '11': { ABM: ['Taylor', 'Mayo'], HUMSS: ['Pavlov', 'Skinner', 'Kohlberg', 'Brunner', 'Gardner'], STEM: ['Pasteur', 'Newton'], TVL: ['Carver', 'Manzke', 'Comorford'] },
  '12': { ABM: ['Drucker', 'Gilbreth'], HUMSS: ['Raleigh', 'Aliegheri', 'Henley', 'Cervantes'], STEM: ['Galileo', 'Einstein'], TVL: ['Apicius', 'Jones', 'Ramsay'] },
};

const FIRST_NAMES = [
  'Juan', 'Maria', 'Carlos', 'Ana', 'Miguel', 'Sofia', 'Luis', 'Elena', 'Diego', 'Isabella',
  'Antonio', 'Carmen', 'Fernando', 'Laura', 'Roberto', 'Patricia', 'Kevin', 'Michelle', 'Daniel', 'Andrea',
  'Jose', 'Rosa', 'Pedro', 'Teresa', 'Pablo', 'Elena', 'Francisco', 'Gabriela', 'Ricardo', 'Adriana',
  'Andres', 'Beatriz', 'Raul', 'Claudia', 'Sergio', 'Diana', 'Jorge', 'Monica', 'Alejandro', 'Natalia',
  'Eduardo', 'Valeria', 'Rafael', 'Mariana', 'Arturo', 'Lucia', 'Hector', 'Paula', 'Oscar', 'Sandra',
  'Victor', 'Clara', 'Manuel', 'Rita', 'Felipe', 'Lorena', 'Gustavo', 'Silvia', 'Rodrigo', 'Ines',
  'Emilio', 'Rocio', 'Ignacio', 'Leticia', 'Alberto', 'Olga', 'Enrique', 'Patricia', 'Cesar', 'Rebecca',
  'Leonardo', 'Esther', 'Marco', 'Veronica', 'Hugo', 'Yolanda', 'Ivan', 'Ximena', 'Javier', 'Zoe',
  'Lorenzo', 'Amanda', 'Nicolas', 'Bianca', 'Mateo', 'Camila', 'Sebastian', 'Daniela', 'Lucas', 'Fernanda',
  'Bruno', 'Gloria', 'Dario', 'Helena', 'Fabian', 'Irene', 'Gonzalo', 'Julia', 'Luciano', 'Karla',
];

const LAST_NAMES = [
  'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Ramos', 'Torres', 'Flores', 'Rivera', 'Gonzalez', 'Martinez',
  'Lopez', 'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Nguyen', 'Chen', 'Kim', 'Villanueva', 'Castro',
  'Mendoza', 'Aquino', 'Bautista', 'Cruz', 'Diaz', 'Espinoza', 'Fernandez', 'Gutierrez', 'Herrera', 'Jimenez',
  'Luna', 'Moreno', 'Navarro', 'Ortega', 'Pena', 'Quintero', 'Romero', 'Santiago', 'Vargas', 'Wood',
  'Alvarez', 'Bennett', 'Chavez', 'Dunn', 'Estrada', 'Fuentes', 'Guerrero', 'Harrison', 'Iglesias', 'Johnston',
  'Khan', 'Lam', 'Maldonado', 'Nunez', 'Ochoa', 'Padilla', 'Quinones', 'Rios', 'Salazar', 'Trujillo',
  'Uribe', 'Valdez', 'Warren', 'Xiong', 'Yoder', 'Zavala', 'Acosta', 'Barrera', 'Cabrera', 'Dominguez',
  'Escobar', 'Frey', 'Gallardo', 'Hanna', 'Ibarra', 'Juarez', 'Kramer', 'Leal', 'Mora', 'Nixon',
  'Orozco', 'Parra', 'Quintana', 'Rubio', 'Solis', 'Tapia', 'Urbina', 'Vega', 'Walsh', 'Yanez',
  'Zuniga', 'Arroyo', 'Beltran', 'Calderon', 'Duarte', 'Espinosa', 'Franco', 'Gallegos', 'Huerta', 'Islas',
];

const COURSES = ['HTML', 'C++', 'Python'];
const LECTURE_IDS = [1, 2, 3, 4, 5, 6];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function getRandomGradeSection() {
  const grade = pick(GRADES);
  const strand = pick(STRANDS);
  const sections = SECTION_BY_GRADE_STRAND[grade]?.[strand] || ['Default'];
  const section = pick(sections);
  return { grade, strand, section };
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
    const usedUsernames = new Set((await users.find({ role: 'student' }).project({ username: 1 }).toArray()).map((r) => r.username));

    const userDocs = [];
    const BATCH = 100;

    for (let i = 0; i < TOTAL; i++) {
      let uname = `s500_${i + 1}`;
      while (usedUsernames.has(uname)) {
        uname = `s500_${i + 1}_${randomInt(1000, 9999)}`;
      }
      usedUsernames.add(uname);

      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const middle = String.fromCharCode(65 + (i % 26)) + '.';
      const fullName = [first, middle, last].join(' ');
      const { grade, strand, section } = getRandomGradeSection();
      const email = `${uname}@codelab.local`;
      const birthday = new Date(2006 + (i % 3), i % 12, (i % 28) + 1);

      userDocs.push({
        full_name: fullName,
        last_name: last,
        first_name: first,
        middle_name: middle,
        username: uname,
        email,
        grade,
        strand,
        section,
        contact: `09${String(100000000 + i).slice(-9)}`,
        birthday,
        age: 17 + (i % 2),
        sex: i % 2 === 0 ? 'Male' : 'Female',
        address: `${randomInt(1, 99)} Sample St, Barangay ${pick(['North', 'South', 'East', 'West'])}`,
        password: hashedPassword,
        role: 'student',
        created_at: now,
      });
    }

    console.log('Inserting 500 students in batches...');
    const insertedIds = [];
    for (let off = 0; off < userDocs.length; off += BATCH) {
      const batch = userDocs.slice(off, off + BATCH);
      const result = await users.insertMany(batch);
      insertedIds.push(...Object.values(result.insertedIds).map((id) => id.toString()));
      console.log(`  Inserted students ${off + 1}-${Math.min(off + BATCH, TOTAL)}`);
    }

    console.log('Adding progress and activity for each student...');
    const progressBatch = [];
    const streakDocs = [];
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    for (let si = 0; si < insertedIds.length; si++) {
      const userId = insertedIds[si];
      const numLectures = randomInt(1, 6);
      const lastActivityMs = thirtyDaysAgo + Math.random() * 29 * 24 * 60 * 60 * 1000;
      const lastActivity = new Date(lastActivityMs);
      const activityDate = lastActivity.toISOString().split('T')[0];

      for (const course of COURSES) {
        for (let lid = 1; lid <= numLectures && lid <= 6; lid++) {
          const lu = new Date(lastActivity.getTime() + (lid - 1) * 60 * 60 * 1000);
          progressBatch.push(
            {
              user_id: userId,
              course,
              lecture_id: String(lid),
              type: 'lecture',
              completed: true,
              score: 0,
              last_updated: lu,
            },
            {
              user_id: userId,
              course,
              lecture_id: String(lid),
              type: 'quiz',
              completed: true,
              score: randomInt(6, 10),
              total: 10,
              last_updated: lu,
            }
          );
        }
      }

      streakDocs.push({
        user_id: userId,
        current_streak: randomInt(0, 7),
        longest_streak: randomInt(1, 14),
        last_activity_date: activityDate,
        total_days_active: randomInt(1, 30),
        updated_at: now,
        created_at: now,
      });
    }

    const PROGRESS_BATCH = 2000;
    for (let off = 0; off < progressBatch.length; off += PROGRESS_BATCH) {
      const batch = progressBatch.slice(off, off + PROGRESS_BATCH);
      await userProgress.insertMany(batch);
      if ((off + PROGRESS_BATCH) % 10000 < PROGRESS_BATCH) console.log(`  Progress docs: ${Math.min(off + PROGRESS_BATCH, progressBatch.length)} / ${progressBatch.length}`);
    }

    for (let off = 0; off < streakDocs.length; off += BATCH) {
      const batch = streakDocs.slice(off, off + BATCH);
      await userStreaks.insertMany(batch);
    }

    console.log(`\nDone. ${insertedIds.length} students seeded with random grade/section and working progress + activity.`);
    console.log('Default password for all:', DEFAULT_PASSWORD);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
