import React, { useState } from 'react';
import './CourseLecture.css';
import LecturePlayer from './LecturePlayer';
import { useProgress } from './ProgressContext';

function CourseLecture({ course, onBack }) {
  const [currentLecture, setCurrentLecture] = useState(null);
  const { getLectureProgress, getQuizProgress, getCourseProgress } = useProgress();
  const courses = {
    HTML: {
      title: "HTML Beginner Course",
      description: "Learn the fundamentals of HTML web development",
      lectures: [
        { id: 1, title: "Introduction to HTML", duration: "15 min", completed: false },
        { id: 2, title: "HTML Document Structure", duration: "20 min", completed: false },
        { id: 3, title: "HTML Elements and Tags", duration: "25 min", completed: false },
        { id: 4, title: "HTML Attributes", duration: "18 min", completed: false },
        { id: 5, title: "HTML Forms", duration: "30 min", completed: false },
        { id: 6, title: "HTML Tables", duration: "22 min", completed: false }
      ]
    },
    "C++": {
      title: "C++ Beginner Course",
      description: "Master the basics of C++ programming language",
      lectures: [
        { id: 1, title: "Introduction to C++", duration: "20 min", completed: false },
        { id: 2, title: "Variables and Data Types", duration: "25 min", completed: false },
        { id: 3, title: "Input and Output", duration: "18 min", completed: false },
        { id: 4, title: "Control Structures", duration: "35 min", completed: false },
        { id: 5, title: "Functions", duration: "30 min", completed: false },
        { id: 6, title: "Arrays and Strings", duration: "28 min", completed: false }
      ]
    },
    Python: {
      title: "Python Beginner Course",
      description: "Start your journey with Python programming",
      lectures: [
        { id: 1, title: "Introduction to Python", duration: "18 min", completed: false },
        { id: 2, title: "Python Variables", duration: "15 min", completed: false },
        { id: 3, title: "Python Data Types", duration: "22 min", completed: false },
        { id: 4, title: "Python Control Flow", duration: "28 min", completed: false },
        { id: 5, title: "Python Functions", duration: "25 min", completed: false },
        { id: 6, title: "Python Lists and Dictionaries", duration: "30 min", completed: false }
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
      />
    );
  }

  return (
    <div className="course-lecture">
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
          </div>

          <div className="lectures-section">
            <h3>Course Lectures</h3>
            <div className="lectures-list">
              {courseData.lectures.map((lecture) => {
                const lectureProgress = getLectureProgress(course, lecture.id);
                const quizProgress = getQuizProgress(course, lecture.id);
                const isCompleted = lectureProgress.completed;
                
                return (
                  <div key={lecture.id} className={`lecture-item ${isCompleted ? 'completed' : ''}`}>
                    <div className="lecture-info">
                      <div className="lecture-number">{lecture.id}</div>
                      <div className="lecture-details">
                        <h4>{lecture.title}</h4>
                        <span className="lecture-duration">{lecture.duration}</span>
                        <div className="lecture-progress">
                          <div className="progress-info">
                            <span className="progress-label">Progress</span>
                            <span className="progress-percentage">
                              {isCompleted ? '100%' : '0%'}
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${isCompleted ? 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      className={`start-lecture-btn ${isCompleted ? 'completed' : ''}`}
                      onClick={() => handleLectureStart(lecture)}
                    >
                      {isCompleted ? '✓ Completed' : 'Start Lecture'}
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
