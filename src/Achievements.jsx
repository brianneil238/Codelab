import React, { useEffect, useState } from 'react';
import { useProgress } from './ProgressContext';

// Rarity: common | rare | epic | legendary. Icon: trophy | flame | code
const RARITY = { common: 25, rare: 50, epic: 75, legendary: 100 };

function buildCatalog() {
  const list = [
    // Perfect first try (common, 25 XP, code icon)
    ...['HTML', 'C++', 'Python'].flatMap((course) =>
      [1, 2, 3, 4, 5, 6].map((lectureId) => ({
        key: `perfect_first_try:${course}:${lectureId}`,
        title: `Perfect on first try – ${course} Quiz ${lectureId}`,
        howToGet: `Score 100% on the ${course} Lecture ${lectureId} quiz the first time you take it (no retakes).`,
        category: course === 'C++' ? 'cpp' : course.toLowerCase(),
        rarity: 'common',
        xp: RARITY.common,
        icon: 'code',
      }))
    ),
    // Python challenges
    { key: 'challenge:py-hello', title: 'Python: Print a Greeting', howToGet: 'Complete the "Python: Print a Greeting" challenge.', category: 'python', rarity: 'common', xp: 25, icon: 'code' },
    { key: 'challenge:py-multi-line', title: 'Python: Multi-line Output', howToGet: 'Complete the "Python: Multi-line Output" challenge.', category: 'python', rarity: 'common', xp: 25, icon: 'code' },
    { key: 'challenge:py-sum', title: 'Python: Sum Two Numbers', howToGet: 'Complete the "Python: Sum Two Numbers" challenge.', category: 'python', rarity: 'rare', xp: 50, icon: 'code' },
    { key: 'challenge:py-conditions', title: 'Python: Even or Odd', howToGet: 'Complete the "Python: Even or Odd" challenge.', category: 'python', rarity: 'rare', xp: 50, icon: 'code' },
    // C++ challenges
    { key: 'challenge:cpp-sum', title: 'C++: Sum Two Numbers', howToGet: 'Complete the "C++: Sum Two Numbers" challenge.', category: 'cpp', rarity: 'rare', xp: 50, icon: 'code' },
    { key: 'challenge:cpp-max', title: 'C++: Maximum of Two', howToGet: 'Complete the "C++: Maximum of Two" challenge.', category: 'cpp', rarity: 'rare', xp: 50, icon: 'code' },
    { key: 'challenge:cpp-loop', title: 'C++: Print 1 to N', howToGet: 'Complete the "C++: Print 1 to N" challenge.', category: 'cpp', rarity: 'epic', xp: 75, icon: 'code' },
    // Course completion (epic)
    { key: 'course_complete:HTML', title: 'HTML Course Complete', howToGet: 'Complete all 6 quizzes in the HTML course.', category: 'course_completion', rarity: 'epic', xp: 100, icon: 'trophy' },
    { key: 'course_complete:C++', title: 'C++ Course Complete', howToGet: 'Complete all 6 quizzes in the C++ course.', category: 'course_completion', rarity: 'epic', xp: 100, icon: 'trophy' },
    { key: 'course_complete:Python', title: 'Python Course Complete', howToGet: 'Complete all 6 quizzes in the Python course.', category: 'course_completion', rarity: 'epic', xp: 100, icon: 'trophy' },
    // Streaks
    { key: 'streak:3', title: '3 Day Streak', howToGet: 'Study on 3 days in a row.', category: 'streaks', rarity: 'rare', xp: 25, icon: 'flame' },
    { key: 'streak:7', title: '7 Day Streak', howToGet: 'Study on 7 days in a row.', category: 'streaks', rarity: 'legendary', xp: 50, icon: 'flame' },
  ];
  return list;
}

const ACHIEVEMENT_CATALOG = buildCatalog();

const challengeTitles = {
  'py-hello': 'Python: Print a Greeting',
  'py-multi-line': 'Python: Multi-line Output',
  'py-sum': 'Python: Sum Two Numbers',
  'py-conditions': 'Python: Even or Odd',
  'cpp-sum': 'C++: Sum Two Numbers',
  'cpp-max': 'C++: Maximum of Two',
  'cpp-loop': 'C++: Print 1 to N',
};

function pretty(key) {
  if (key.startsWith('perfect_first_try:')) {
    const parts = key.split(':');
    return `Perfect on first try – ${parts[1]} Quiz ${parts[2]}`;
  }
  if (key.startsWith('challenge:')) {
    const id = key.slice('challenge:'.length);
    const title = challengeTitles[id];
    return title ? title : id;
  }
  if (key.startsWith('course_complete:')) {
    const course = key.slice('course_complete:'.length);
    return `${course} Course Complete`;
  }
  if (key === 'streak:3') return '3 Day Streak';
  if (key === 'streak:7') return '7 Day Streak';
  return key;
}

export function getAchievementTitle(key) {
  const entry = ACHIEVEMENT_CATALOG.find((a) => a.key === key);
  return entry ? entry.title : pretty(key);
}

/** XP reward for an achievement key (for popup display). */
export function getAchievementXp(key) {
  const entry = ACHIEVEMENT_CATALOG.find((a) => a.key === key);
  return entry?.xp ?? 0;
}

const CATEGORY_LABELS = {
  streaks: 'Streaks',
  python: 'Python',
  html: 'HTML',
  cpp: 'C++',
  course_completion: 'Course Completion',
};

const XP_PER_LEVEL = 500;

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Complete' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'not_complete', label: 'Not complete' },
];

function Achievements({ baseUrl, user, darkMode = false }) {
  const { streak = {} } = useProgress ? useProgress() : { streak: {} };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const url = (baseUrl || '') + `/achievements/${user.id}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setItems(data.achievements || []);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, baseUrl]);

  const earnedKeys = new Set((items || []).map((a) => a.key));
  const totalCount = ACHIEVEMENT_CATALOG.length;
  const earnedCount = earnedKeys.size;
  const totalXP = ACHIEVEMENT_CATALOG.filter((a) => earnedKeys.has(a.key)).reduce((sum, a) => sum + (a.xp || 0), 0);
  const level = 1 + Math.floor(totalXP / XP_PER_LEVEL);
  const xpInCurrentLevel = totalXP % XP_PER_LEVEL;
  const currentStreak = streak.current_streak ?? 0;

  // First unearned in each category = "in progress"
  const firstUnearnedByCategory = {};
  ACHIEVEMENT_CATALOG.forEach((a) => {
    if (earnedKeys.has(a.key)) return;
    if (firstUnearnedByCategory[a.category] == null) firstUnearnedByCategory[a.category] = a.key;
  });

  if (loading) {
    return (
      <div className="achievements-dashboard-loading">
        <div className="achievements-dashboard-loading-spinner" />
        <p>Loading achievements...</p>
      </div>
    );
  }

  const displayName = user?.username || user?.fullName || user?.firstName || 'Coder';
  const avatarLetter = (displayName || 'U').toString().charAt(0).toUpperCase();
  const avatarSrc = user?.profilePhoto || '/profile-avatar.png';

  const getState = (entry) => {
    const earned = earnedKeys.has(entry.key);
    const inProgress = !earned && firstUnearnedByCategory[entry.category] === entry.key;
    return earned ? 'completed' : inProgress ? 'in_progress' : 'locked';
  };
  const filteredCatalog =
    statusFilter === 'all'
      ? ACHIEVEMENT_CATALOG
      : ACHIEVEMENT_CATALOG.filter((a) => {
          const state = getState(a);
          if (statusFilter === 'completed') return state === 'completed';
          if (statusFilter === 'in_progress') return state === 'in_progress';
          if (statusFilter === 'not_complete') return state === 'locked';
          return true;
        });
  const grouped = filteredCatalog.reduce((acc, a) => {
    const cat = a.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});
  const categoryOrder = ['streaks', 'python', 'html', 'cpp', 'course_completion'];
  const orderedCategories = categoryOrder.filter((c) => grouped[c]?.length);

  return (
    <div className={`achievements-dashboard ${darkMode ? 'achievements-dashboard-dark' : ''}`}>
      {/* Hero: avatar, name, level, XP bar, streak, achievement count */}
      <div className="achievements-hero achievements-glass">
        <div className="achievements-hero-left">
          <div className="achievements-hero-avatar" aria-hidden>
            <img
              src={avatarSrc}
              alt=""
              className="achievements-hero-avatar-img"
              onError={(e) => {
                const el = e.target;
                if (el) {
                  el.style.display = 'none';
                  const fallback = el.nextElementSibling;
                  if (fallback) fallback.classList.add('achievements-hero-avatar-fallback-visible');
                }
              }}
            />
            <span className="achievements-hero-avatar-fallback" aria-hidden>{avatarLetter}</span>
          </div>
          <div className="achievements-hero-info">
            <div className="achievements-hero-name">
              {displayName} <span className="achievements-hero-level">| Level {level} Coder</span>
              <span className="achievements-hero-level-icon" aria-hidden>🏆</span>
            </div>
            <div className="achievements-hero-xp-row">
              <span className="achievements-hero-xp-label">XP: {xpInCurrentLevel} / {XP_PER_LEVEL}</span>
              <div className="achievements-hero-xp-bar">
                <div className="achievements-hero-xp-fill" style={{ width: `${(xpInCurrentLevel / XP_PER_LEVEL) * 100}%` }} />
              </div>
              <span className="achievements-hero-streak" title="Current streak">
                <span className="achievements-hero-streak-icon" aria-hidden>🔥</span>
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="achievements-hero-right">
          <div className="achievements-hero-achievement-wrap">
            <div className="achievements-hero-achievement-count">
              <span className="achievements-hero-achievement-num">{earnedCount} / {totalCount}</span>
              <span className="achievements-hero-achievement-label">achievements</span>
            </div>
            <div className="achievements-hero-achievement-bar">
              <div className="achievements-hero-achievement-fill" style={{ width: `${totalCount ? (earnedCount / totalCount) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="achievements-hero-level-badge achievements-glass">
            <span className="achievements-hero-level-badge-icon" aria-hidden>🏆</span>
            <span className="achievements-hero-level-badge-text">Level {level} Coder</span>
            <span className="achievements-hero-level-badge-xp">{totalXP} XP</span>
          </div>
        </div>
      </div>

      {/* Filter: All | Complete | In progress | Not complete */}
      <div className="achievements-filter-row">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`achievements-filter-btn ${statusFilter === value ? 'achievements-filter-btn--active' : ''}`}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Catalog by category */}
      {orderedCategories.map((cat) => (
        <section key={cat} className="achievements-catalog-section">
          <h3 className="achievements-catalog-section-title">{CATEGORY_LABELS[cat] || cat}</h3>
          <div className="achievements-cards-grid">
            {(grouped[cat] || []).map((entry) => {
              const earned = earnedKeys.has(entry.key);
              const inProgress = !earned && firstUnearnedByCategory[entry.category] === entry.key;
              const state = earned ? 'completed' : inProgress ? 'in_progress' : 'locked';
              return (
                <div
                  key={entry.key}
                  className={`achievements-card achievements-card--${state}`}
                  title={entry.howToGet}
                >
                  <div className="achievements-card-glow" />
                  <div className="achievements-card-icon-wrap" aria-hidden>
                    {entry.icon === 'flame' && <span className="achievements-card-icon achievements-card-icon--flame">🔥</span>}
                    {entry.icon === 'trophy' && <span className="achievements-card-icon achievements-card-icon--trophy">🏆</span>}
                    {entry.icon === 'code' && <span className="achievements-card-icon achievements-card-icon--code">&lt;/&gt;</span>}
                  </div>
                  {state === 'locked' && <span className="achievements-card-lock" aria-hidden>🔒</span>}
                  <div className="achievements-card-body">
                    <h4 className="achievements-card-title">{entry.title}</h4>
                    <p className="achievements-card-requirement">{entry.howToGet}</p>
                    <div className="achievements-card-footer">
                      {earned && <span className="achievements-card-status achievements-card-status--completed">Completed ✓</span>}
                      {inProgress && <span className="achievements-card-status achievements-card-status--in_progress">In Progress</span>}
                      <span className="achievements-card-xp">+{entry.xp} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default Achievements;
