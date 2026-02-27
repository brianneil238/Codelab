import React, { useState } from 'react';
import './CourseLecture.css';
import LecturePlayer from './LecturePlayer';
import { useProgress } from './ProgressContext';

function CourseLecture({ course, onBack, darkMode = false }) {
  const [currentLecture, setCurrentLecture] = useState(null);
  const { getLectureProgress, getQuizProgress, getCourseProgress } = useProgress();
  // One short tutorial video per lecture. Set each title to match your video; update lectureContent in LecturePlayer.jsx too.
  const courses = {
    HTML: {
      title: "HTML Beginner Course",
      description: "Each lecture has a short tutorial video – watch it, then read the notes and try the exercises",
      lectures: [
        { id: 1, title: "Lecture 1", duration: "~10 min", completed: false },
        { id: 2, title: "Lecture 2", duration: "~10 min", completed: false },
        { id: 3, title: "Lecture 3", duration: "~10 min", completed: false },
        { id: 4, title: "Lecture 4", duration: "~10 min", completed: false },
        { id: 5, title: "Lecture 5", duration: "~10 min", completed: false },
        { id: 6, title: "Lecture 6", duration: "~10 min", completed: false }
      ]
    },
    "C++": {
      title: "C++ Beginner Course",
      description: "Each lecture has a short tutorial video – watch it, then read the notes and try the exercises",
      lectures: [
        { id: 1, title: "Lecture 1", duration: "~10 min", completed: false },
        { id: 2, title: "Lecture 2", duration: "~10 min", completed: false },
        { id: 3, title: "Lecture 3", duration: "~10 min", completed: false },
        { id: 4, title: "Lecture 4", duration: "~10 min", completed: false },
        { id: 5, title: "Lecture 5", duration: "~10 min", completed: false },
        { id: 6, title: "Lecture 6", duration: "~10 min", completed: false }
      ]
    },
    Python: {
      title: "Python Beginner Course",
      description: "Each lecture has a short tutorial video – watch it, then read the notes and try the exercises",
      lectures: [
        { id: 1, title: "Lecture 1", duration: "~10 min", completed: false },
        { id: 2, title: "Lecture 2", duration: "~10 min", completed: false },
        { id: 3, title: "Lecture 3", duration: "~10 min", completed: false },
        { id: 4, title: "Lecture 4", duration: "~10 min", completed: false },
        { id: 5, title: "Lecture 5", duration: "~10 min", completed: false },
        { id: 6, title: "Lecture 6", duration: "~10 min", completed: false }
      ]
    }
  };

  const courseData = courses[course] || courses.HTML;

  const handleLectureStart = (lecture) => {
    setCurrentLecture(lecture);
  };

  const handleBackToCourse = () => {
    setCurrentLecture(null);
  };

  // If a lecture is selected, show the lecture player
  if (currentLecture) {
    return (
      <LecturePlayer 
        lecture={currentLecture} 
        course={course} 
        onBack={handleBackToCourse}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`course-lecture${darkMode ? ' course-lecture-dark' : ''}`}>
      <header className="course-header">
        <div className="course-header-content">
          <button className="back-btn" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <div className="course-info">
            <h1>{courseData.title}</h1>
            <p>{courseData.description}</p>
          </div>
        </div>
      </header>

      <main className="course-main">
        <div className="course-container">
          <div className="course-progress">
            <h3>Course Progress</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${getCourseProgress(course).progress}%` }}></div>
            </div>
            <span className="progress-text">{getCourseProgress(course).progress}% Complete</span>
            <span className="progress-breakdown">{getCourseProgress(course).lecturesMarkedComplete ?? 0}/{getCourseProgress(course).totalLectures ?? 6} lectures completed · {getCourseProgress(course).quizzesTaken ?? 0}/{getCourseProgress(course).totalLectures ?? 6} quizzes taken</span>
          </div>

          <div className="lectures-section">
            <h3>Course Lectures</h3>
            <div className="lectures-list">
              {courseData.lectures.map((lecture) => {
                const lectureProgress = getLectureProgress(course, lecture.id);
                const quizProgress = getQuizProgress(course, lecture.id);
                const lectureDone = lectureProgress.completed;
                const quizDone = quizProgress.completed;
                const isFullyComplete = lectureDone && quizDone;
                
                return (
                  <div key={lecture.id} className={`lecture-item ${isFullyComplete ? 'completed' : ''}`}>
                    <div className="lecture-info">
                      <div className="lecture-number">{lecture.id}</div>
                      <div className="lecture-details">
                        <h4>{lecture.title}</h4>
                        <span className="lecture-duration">{lecture.duration}</span>
                        <div className="lecture-progress">
                          <div className="progress-info">
                            <span className="progress-label">Progress</span>
                            <span className="progress-percentage">
                              {lectureDone ? '100%' : '0%'}
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${lectureDone ? 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className={`lecture-quiz-status ${quizDone ? 'quiz-taken' : 'quiz-pending'}`}>
                            {quizDone ? '✓ Quiz taken' : 'Quiz not taken'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className={`start-lecture-btn ${isFullyComplete ? 'completed' : ''}`}
                      onClick={() => handleLectureStart(lecture)}
                    >
                      {isFullyComplete ? '✓ Completed' : lectureDone ? 'Take quiz' : 'Start Lecture'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="course-actions">
            <button className="course-btn primary">Start Course</button>
            <button className="course-btn secondary">Download Materials</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CourseLecture;
