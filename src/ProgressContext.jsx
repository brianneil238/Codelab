import React, { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem('codelab-progress');
    return savedProgress ? JSON.parse(savedProgress) : {
      lectures: {},
      quizzes: {},
      courses: {}
    };
  });

  // Save progress to localStorage whenever it changes
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
    setProgress(prev => ({
      ...prev,
      lectures: {
        ...prev.lectures,
        [`${course}-${lectureId}`]: {
          completed: true,
          completedAt: new Date().toISOString(),
          progress: 100
        }
      }
    }));
    updateCourseProgress(course);
  };

  const markQuizComplete = (course, lectureId, score, total) => {
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;
    
    setProgress(prev => ({
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
    }));
    updateCourseProgress(course);
  };

  const updateCourseProgress = (course) => {
    setProgress(prev => {
      const courseLectures = getCourseLectures(course);
      const courseQuizzes = getCourseQuizzes(course);
      
      const completedLectures = courseLectures.filter(lectureId => 
        prev.lectures[`${course}-${lectureId}`]?.completed
      ).length;
      
      const completedQuizzes = courseQuizzes.filter(lectureId => 
        prev.quizzes[`${course}-${lectureId}`]?.completed
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
