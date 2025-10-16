import React, { useEffect, useState } from 'react';

function Achievements({ baseUrl, user }) {
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

  if (loading) return <div>Loading achievements...</div>;

  if (!items.length) return <div>No achievements yet. Take quizzes to earn badges!</div>;

  const pretty = (key) => {
    if (key.startsWith('perfect_first_try:')) {
      const parts = key.split(':');
      return `Perfect on first try - ${parts[1]} Quiz ${parts[2]}`;
    }
    return key;
  };

  return (
    <ul>
      {items.map((a, i) => (
        <li key={i}>{pretty(a.key)} <small style={{ color: '#666' }}>({new Date(a.created_at).toLocaleString()})</small></li>
      ))}
    </ul>
  );
}

export default Achievements;


