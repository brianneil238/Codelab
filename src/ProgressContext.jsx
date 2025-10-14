import React, { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children, user }) => {
  const [progress, setProgress] = useState({
    lectures: {},
    quizzes: {},
    courses: {}
  });
  const [isLoading, setIsLoading] = useState(false);

  // API base URL
  const API_URL = import.meta.env.VITE_API_URL || '';
  const useAbsolute = API_URL && !API_URL.includes('localhost');
  const baseUrl = useAbsolute ? API_URL : '';

  // Load progress from backend when user changes
  useEffect(() => {
    if (user?.id) {
      loadProgressFromBackend(user.id);
    }
  }, [user?.id]);

  // Load progress from backend
  const loadProgressFromBackend = async (userId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/progress/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const backendProgress = data.progress || [];
        
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
            convertedProgress.quizzes[key] = {
              completed: item.completed,
              score: item.score,
              total: 10, // Assuming 10 questions per quiz
              percentage: Math.round((item.score / 10) * 100),
              passed: item.score >= 7, // Assuming 70% pass rate
              completedAt: item.last_updated
            };
          }
        });
        
        setProgress(convertedProgress);
        
        // Update course progress
        const courses = ['HTML', 'C++', 'Python'];
        courses.forEach(course => {
          updateCourseProgress(course, convertedProgress);
        });
      }
    } catch (error) {
      console.error('Error loading progress from backend:', error);
      // Fallback to localStorage if backend fails
      loadProgressFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: Load progress from localStorage
  const loadProgressFromLocalStorage = () => {
    const savedProgress = localStorage.getItem('codelab-progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  };

  // Save progress to backend
  const saveProgressToBackend = async (userId, course, lectureId, type, completed, score = 0) => {
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
          score
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save progress to backend');
      }
    } catch (error) {
      console.error('Error saving progress to backend:', error);
    }
  };

  // Save progress to localStorage as backup
  useEffect(() => {
    localStorage.setItem('codelab-progress', JSON.stringify(progress));
  }, [progress]);

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
        saveProgressToBackend(user.id, course, lectureId, 'quiz', true, score);
      }
      
      return newProgress;
    });
    updateCourseProgress(course);
  };

  const updateCourseProgress = (course, progressData = null) => {
    setProgress(prev => {
      const data = progressData || prev;
      const courseLectures = getCourseLectures(course);
      const courseQuizzes = getCourseQuizzes(course);
      
      const completedLectures = courseLectures.filter(lectureId => 
        data.lectures[`${course}-${lectureId}`]?.completed
      ).length;
      
      const completedQuizzes = courseQuizzes.filter(lectureId => 
        data.quizzes[`${course}-${lectureId}`]?.completed
      ).length;
      
      const totalItems = courseLectures.length + courseQuizzes.length;
      const completedItems = completedLectures + completedQuizzes;
      const coursePercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      
      return {
        ...prev,
        courses: {
          ...prev.courses,
          [course]: {
            totalLectures: courseLectures.length,
            completedLectures: completedLectures,
            totalQuizzes: courseQuizzes.length,
            completedQuizzes: completedQuizzes,
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
    // Define quizzes for each course (same as lectures for now)
    const courseData = {
      HTML: [1, 2, 3],
      'C++': [1],
      Python: [1]
    };
    return courseData[course] || [];
  };

  const getLectureProgress = (course, lectureId) => {
    return progress.lectures[`${course}-${lectureId}`] || { completed: false, progress: 0 };
  };

  const getQuizProgress = (course, lectureId) => {
    return progress.quizzes[`${course}-${lectureId}`] || { completed: false, score: 0, total: 0, percentage: 0 };
  };

  const getCourseProgress = (course) => {
    return progress.courses[course] || {
      totalLectures: 0,
      completedLectures: 0,
      totalQuizzes: 0,
      completedQuizzes: 0,
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

  const resetProgress = () => {
    setProgress({
      lectures: {},
      quizzes: {},
      courses: {}
    });
  };

  const value = {
    progress,
    markLectureComplete,
    markQuizComplete,
    getLectureProgress,
    getQuizProgress,
    getCourseProgress,
    getOverallProgress,
    resetProgress
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
