import React, { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children, user, onAchievementUnlocked }) => {
  const [progress, setProgress] = useState({
    lectures: {},
    quizzes: {},
    courses: {}
  });
  const [streak, setStreak] = useState({
    current_streak: 0,
    longest_streak: 0,
    total_days_active: 0
  });
  const [stats, setStats] = useState({
    code_lines_written: 0,
    challenges_completed: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // In dev, use /api so Vite proxies to localhost:5000. Otherwise use VITE_API_URL or Render URL.
  const baseUrl = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'https://codelab-api-qq4v.onrender.com');
  
  console.log('ProgressContext - baseUrl:', baseUrl);

  // Load progress, streak, and stats from backend when user changes (database is source of truth)
  useEffect(() => {
    if (user?.id) {
      console.log('User logged in, loading progress for user ID:', user.id);
      loadProgressFromBackend(user.id);
      loadStreakFromBackend(user.id);
      loadStatsFromBackend(user.id);
      syncLocalStorageToBackend(user.id);
    } else {
      console.log('No user ID available, skipping progress load');
    }
  }, [user?.id]);

  // Load streak from backend
  const loadStreakFromBackend = async (userId) => {
    try {
      const response = await fetch(`${baseUrl}/streak/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStreak(data.streak || {
          current_streak: 0,
          longest_streak: 0,
          total_days_active: 0
        });
      }
    } catch (error) {
      console.error('Error loading streak from backend:', error);
    }
  };

  // Explicitly tick/update the user's streak
  const tickStreak = async (userId) => {
    try {
      const response = await fetch(`${baseUrl}/streak/${userId}/tick`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data?.streak) setStreak(data.streak);
        if (data?.achievementAwarded?.key && onAchievementUnlocked) {
          onAchievementUnlocked(data.achievementAwarded.key);
        }
      }
    } catch (error) {
      console.error('Error ticking streak:', error);
    }
  };

  const loadStatsFromBackend = async (userId) => {
    try {
      const response = await fetch(`${baseUrl}/stats/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          code_lines_written: data.code_lines_written ?? 0,
          challenges_completed: data.challenges_completed ?? 0
        });
      }
    } catch (error) {
      console.error('Error loading stats from backend:', error);
    }
  };

  const addCodeLinesWritten = async (linesToAdd) => {
    if (!user?.id || !linesToAdd || linesToAdd <= 0) return;
    try {
      const response = await fetch(`${baseUrl}/stats/${user.id}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linesToAdd })
      });
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          code_lines_written: data.code_lines_written ?? prev.code_lines_written + linesToAdd
        }));
      }
    } catch (error) {
      console.error('Error adding code lines:', error);
    }
  };

  // Load progress from backend
  const loadProgressFromBackend = async (userId, retryCount = 0) => {
    setIsLoading(true);
    try {
      console.log('Loading progress for user:', userId);
      console.log('Using baseUrl:', baseUrl);
      const response = await fetch(`${baseUrl}/progress/${userId}`);
      console.log('Progress response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const backendProgress = data.progress || [];
        console.log('Backend progress data:', backendProgress);
        
        // Convert backend format to frontend format
        const convertedProgress = {
          lectures: {},
          quizzes: {},
          courses: {}
        };
        
        backendProgress.forEach(item => {
          const key = `${item.course}-${item.lecture_id}`;
          if (item.type === 'lecture') {
            convertedProgress.lectures[key] = {
              completed: item.completed,
              completedAt: item.last_updated,
              progress: item.completed ? 100 : 0
            };
          } else if (item.type === 'quiz') {
            const total = item.total && item.total > 0 ? item.total : 10;
            convertedProgress.quizzes[key] = {
              completed: item.completed,
              score: item.score ?? 0,
              total,
              percentage: total > 0 ? Math.round((item.score / total) * 100) : 0,
              passed: total > 0 && item.score >= Math.ceil(total * 0.7),
              completedAt: item.last_updated
            };
          }
        });
        
        if (backendProgress.length === 0) {
          console.log('No backend progress in database; trying user-specific local backup');
          loadProgressFromLocalStorage(userId);
        } else {
          console.log('Loaded progress from database:', convertedProgress);
          setProgress(convertedProgress);
          // Backup to user-specific localStorage
          localStorage.setItem(`codelab-progress-${userId}`, JSON.stringify(convertedProgress));
        }
        
        // Update course progress after setting the progress state
        setTimeout(() => {
          const courses = ['HTML', 'C++', 'Python'];
          courses.forEach(course => {
            updateCourseProgress(course);
          });
        }, 100);
      } else {
        console.error('Failed to load progress, status:', response.status);
        loadProgressFromLocalStorage(userId);
      }
    } catch (error) {
      console.error('Error loading progress from backend:', error);
      if (retryCount === 0 && error.name === 'TypeError') {
        console.log('Retrying progress load...');
        setTimeout(() => loadProgressFromBackend(userId, 1), 2000);
        return;
      }
      loadProgressFromLocalStorage(userId);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: Load progress from localStorage (user-specific key so we don't mix users)
  const loadProgressFromLocalStorage = (userId) => {
    const storageKey = userId ? `codelab-progress-${userId}` : 'codelab-progress';
    console.log('Loading progress from localStorage:', storageKey);
    const savedProgress = localStorage.getItem(storageKey);
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        console.log('Loaded progress from localStorage:', parsedProgress);
        setProgress(parsedProgress);
        const courses = ['HTML', 'C++', 'Python'];
        courses.forEach(course => {
          updateCourseProgress(course);
        });
      } catch (error) {
        console.error('Error parsing localStorage progress:', error);
      }
    } else {
      console.log('No progress found in localStorage for', userId || 'default');
    }
  };

  // Sync this user's localStorage progress to backend (only user-specific key to avoid mixing users)
  const syncLocalStorageToBackend = async (userId) => {
    const savedProgress = localStorage.getItem(`codelab-progress-${userId}`);
    if (!savedProgress) return;
    try {
      const parsedProgress = JSON.parse(savedProgress);
      const lectures = parsedProgress.lectures || {};
      const quizzes = parsedProgress.quizzes || {};
      for (const [key, lecture] of Object.entries(lectures)) {
        if (lecture.completed) {
          const [course, lectureId] = key.split('-');
          await saveProgressToBackend(userId, course, parseInt(lectureId, 10), 'lecture', true);
        }
      }
      for (const [key, quiz] of Object.entries(quizzes)) {
        if (quiz.completed) {
          const [course, lectureId] = key.split('-');
          await saveProgressToBackend(userId, course, parseInt(lectureId, 10), 'quiz', true, quiz.score, quiz.total || 10);
        }
      }
    } catch (error) {
      console.error('Error syncing localStorage to backend:', error);
    }
  };

  // Save progress to backend
  const saveProgressToBackend = async (userId, course, lectureId, type, completed, score = 0, total = 0) => {
    try {
      const response = await fetch(`${baseUrl}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          course,
          lectureId,
          type,
          completed,
          score,
          total
        })
      });

      if (response.ok && onAchievementUnlocked) {
        try {
          const data = await response.json();
          if (data.achievementAwarded?.key) {
            onAchievementUnlocked(data.achievementAwarded.key);
          }
        } catch (e) {
          // ignore parse error
        }
      }

      if (!response.ok) {
        console.error('Failed to save progress to backend, status:', response.status);
        // Don't throw error, just log it - progress is still saved locally
      }
    } catch (error) {
      console.error('Error saving progress to backend:', error);
      // Don't throw error, just log it - progress is still saved locally
    }
  };

  // Save progress to localStorage as backup (per-user key so progress is not mixed between users)
  useEffect(() => {
    const key = user?.id ? `codelab-progress-${user.id}` : 'codelab-progress';
    localStorage.setItem(key, JSON.stringify(progress));
  }, [progress, user?.id]);

  // Initialize course progress on mount
  useEffect(() => {
    const courses = ['HTML', 'C++', 'Python'];
    courses.forEach(course => {
      updateCourseProgress(course);
    });
  }, []); // Run once on mount

  const markLectureComplete = (course, lectureId) => {
    setProgress(prev => {
      const newProgress = {
        ...prev,
        lectures: {
          ...prev.lectures,
          [`${course}-${lectureId}`]: {
            completed: true,
            completedAt: new Date().toISOString(),
            progress: 100
          }
        }
      };
      
      // Save to backend
      if (user?.id) {
        saveProgressToBackend(user.id, course, lectureId, 'lecture', true);
        // Also tick streak on successful progress
        tickStreak(user.id);
      }
      
      return newProgress;
    });
    updateCourseProgress(course);
  };

  const markQuizComplete = (course, lectureId, score, total) => {
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;
    
    setProgress(prev => {
      const newProgress = {
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [`${course}-${lectureId}`]: {
            completed: true,
            score: score,
            total: total,
            percentage: percentage,
            passed: passed,
            completedAt: new Date().toISOString()
          }
        }
      };
      
      // Save to backend
      if (user?.id) {
        saveProgressToBackend(user.id, course, lectureId, 'quiz', true, score, total);
        // Also tick streak on successful progress
        tickStreak(user.id);
      }
      
      return newProgress;
    });
    updateCourseProgress(course);
  };

  const updateCourseProgress = (course, progressData = null) => {
    setProgress(prev => {
      const data = progressData || prev;
      const lectureIds = getCourseLectures(course); // [1,2,3,4,5,6]
      const totalLectures = lectureIds.length;

      let lecturesMarkedComplete = 0;
      let quizzesTaken = 0;
      let fullyComplete = 0; // both lecture marked AND quiz taken

      lectureIds.forEach(lectureId => {
        const key = `${course}-${lectureId}`;
        const lectureDone = !!data.lectures[key]?.completed;
        const quizDone = !!data.quizzes[key]?.completed;
        if (lectureDone) lecturesMarkedComplete++;
        if (quizDone) quizzesTaken++;
        if (lectureDone && quizDone) fullyComplete++;
      });

      // Progress % = lectures fully complete (both marked + quiz taken) per total
      const coursePercentage = totalLectures > 0 ? Math.round((fullyComplete / totalLectures) * 100) : 0;

      return {
        ...prev,
        courses: {
          ...prev.courses,
          [course]: {
            totalLectures,
            lecturesMarkedComplete,
            quizzesTaken,
            fullyComplete,
            progress: coursePercentage,
            lastUpdated: new Date().toISOString()
          }
        }
      };
    });
  };

  const getCourseLectures = (course) => {
    // Define lectures for each course
    const courseData = {
      HTML: [1, 2, 3, 4, 5, 6],
      'C++': [1, 2, 3, 4, 5, 6],
      Python: [1, 2, 3, 4, 5, 6]
    };
    return courseData[course] || [];
  };

  const getCourseQuizzes = (course) => {
    // One quiz per lecture (6 per course)
    return getCourseLectures(course);
  };

  const getLectureProgress = (course, lectureId) => {
    return progress.lectures[`${course}-${lectureId}`] || { completed: false, progress: 0 };
  };

  const getQuizProgress = (course, lectureId) => {
    return progress.quizzes[`${course}-${lectureId}`] || { completed: false, score: 0, total: 0, percentage: 0 };
  };

  const getCourseProgress = (course) => {
    return progress.courses[course] || {
      totalLectures: 6,
      lecturesMarkedComplete: 0,
      quizzesTaken: 0,
      fullyComplete: 0,
      progress: 0
    };
  };

  const getOverallProgress = () => {
    const courses = ['HTML', 'C++', 'Python'];
    const totalCourses = courses.length;
    let totalProgress = 0;
    
    courses.forEach(course => {
      const courseProgress = getCourseProgress(course);
      totalProgress += courseProgress.progress;
    });
    
    return totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;
  };

  const getStreak = () => {
    return streak;
  };

  const resetProgress = () => {
    setProgress({
      lectures: {},
      quizzes: {},
      courses: {}
    });
  };

  // Manual refresh function to force reload progress
  const refreshProgress = () => {
    if (user?.id) {
      console.log('Manual refresh triggered for user:', user.id);
      loadProgressFromBackend(user.id);
      loadStreakFromBackend(user.id);
      loadStatsFromBackend(user.id);
    }
  };

  const value = {
    progress,
    streak,
    stats,
    isLoading,
    markLectureComplete,
    markQuizComplete,
    getLectureProgress,
    getQuizProgress,
    getCourseProgress,
    getOverallProgress,
    getStreak,
    addCodeLinesWritten,
    resetProgress,
    refreshProgress
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
