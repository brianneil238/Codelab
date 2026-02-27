import React, { useEffect, useState } from 'react';

// All achievements that can be earned, with how to get them (single source of truth)
const ACHIEVEMENT_CATALOG = [
  // Perfect first try: get 100% on a quiz the first time you take it (per lecture)
  ...['HTML', 'C++', 'Python'].flatMap((course) =>
    [1, 2, 3, 4, 5, 6].map((lectureId) => ({
      key: `perfect_first_try:${course}:${lectureId}`,
      title: `Perfect on first try – ${course} Quiz ${lectureId}`,
      howToGet: `Score 100% on the ${course} Lecture ${lectureId} quiz the first time you take it (no retakes).`,
    }))
  ),
  // Coding challenges
  { key: 'challenge:py-hello', title: 'Python: Print a Greeting', howToGet: 'Complete the "Python: Print a Greeting" challenge in Challenges. Print exactly: Hello, CodeLab!' },
  { key: 'challenge:py-multi-line', title: 'Python: Multi-line Output', howToGet: 'Complete the "Python: Multi-line Output" challenge. Print three lines: Line 1, Line 2, Line 3.' },
  { key: 'challenge:py-sum', title: 'Python: Sum Two Numbers', howToGet: 'Complete the "Python: Sum Two Numbers" challenge. Read two integers and print their sum.' },
  { key: 'challenge:py-conditions', title: 'Python: Even or Odd', howToGet: 'Complete the "Python: Even or Odd" challenge. Read an integer and print "Even" or "Odd".' },
  { key: 'challenge:cpp-sum', title: 'C++: Sum Two Numbers', howToGet: 'Complete the "C++: Sum Two Numbers" challenge. Read two integers and print their sum.' },
  { key: 'challenge:cpp-max', title: 'C++: Maximum of Two', howToGet: 'Complete the "C++: Maximum of Two" challenge. Read two integers and print the larger one.' },
  { key: 'challenge:cpp-loop', title: 'C++: Print 1 to N', howToGet: 'Complete the "C++: Print 1 to N" challenge. Read N and print numbers 1 to N, one per line.' },
  // Course complete: finish all 6 quizzes for a course
  { key: 'course_complete:HTML', title: 'HTML Course Complete', howToGet: 'Complete all 6 quizzes in the HTML course (one quiz per lecture).' },
  { key: 'course_complete:C++', title: 'C++ Course Complete', howToGet: 'Complete all 6 quizzes in the C++ course (one quiz per lecture).' },
  { key: 'course_complete:Python', title: 'Python Course Complete', howToGet: 'Complete all 6 quizzes in the Python course (one quiz per lecture).' },
  // Streak milestones
  { key: 'streak:3', title: '3 Day Streak', howToGet: 'Study on 3 days in a row. Complete a lecture or quiz each day to keep your streak.' },
  { key: 'streak:7', title: '7 Day Streak', howToGet: 'Study on 7 days in a row. Keep coming back daily to build your streak!' },
];

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
    return title ? `Challenge: ${title}` : `Challenge: ${id}`;
  }
  if (key.startsWith('course_complete:')) {
    const course = key.slice('course_complete:'.length);
    return `${course} Course Complete`;
  }
  if (key === 'streak:3') return '3 Day Streak';
  if (key === 'streak:7') return '7 Day Streak';
  return key;
}

/** Human-readable title for an achievement key (for toasts / notifications). */
export function getAchievementTitle(key) {
  const entry = ACHIEVEMENT_CATALOG.find((a) => a.key === key);
  return entry ? entry.title : pretty(key);
}

function Achievements({ baseUrl, user, darkMode = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className={darkMode ? 'achievements-loading achievements-loading-dark' : 'achievements-loading'}>Loading achievements...</div>;

  const earnedItems = items.map((a) => ({ key: a.key, title: getAchievementTitle(a.key), created_at: a.created_at }));

  return (
    <div className={darkMode ? 'achievements-wrap achievements-wrap-dark' : 'achievements-wrap'}>
      {/* Your achievements first – compact summary */}
      <section className="achievements-earned">
        <h3 className={darkMode ? 'achievements-earned-title achievements-earned-title-dark' : 'achievements-earned-title'}>
          Your achievements <span className="achievements-count">({earnedItems.length})</span>
        </h3>
        {!items.length ? (
          <div className={darkMode ? 'achievements-empty achievements-empty-dark' : 'achievements-empty'}>
            No achievements yet. Complete quizzes and challenges to earn badges!
          </div>
        ) : (
          <div className="achievements-earned-grid">
            {earnedItems.map((a, i) => (
              <div key={a.key} className={darkMode ? 'achievements-earned-tile achievements-earned-tile-dark' : 'achievements-earned-tile'} title={new Date(a.created_at).toLocaleString()}>
                <span className="achievements-earned-tile-icon" aria-hidden>🏆</span>
                <span className="achievements-earned-tile-title">{a.title}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All achievements in a compact grid – less scroll */}
      <section className="achievements-catalog">
        <h3 className={darkMode ? 'achievements-catalog-title achievements-catalog-title-dark' : 'achievements-catalog-title'}>
          How to earn
        </h3>
        <div className={darkMode ? 'achievements-catalog-grid achievements-catalog-grid-dark' : 'achievements-catalog-grid'}>
          {ACHIEVEMENT_CATALOG.map(({ key, title, howToGet }) => {
            const earned = earnedKeys.has(key);
            return (
              <div key={key} className={`achievements-catalog-tile ${earned ? 'achievements-catalog-tile-earned' : ''}`} title={howToGet}>
                <span className="achievements-catalog-tile-icon" aria-hidden>{earned ? '✓' : '○'}</span>
                <span className="achievements-catalog-tile-name">{title}</span>
                {earned && <span className={darkMode ? 'achievements-catalog-badge achievements-catalog-badge-dark' : 'achievements-catalog-badge'}>Earned</span>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Achievements;


