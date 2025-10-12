import React, { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import CourseLecture from './CourseLecture';
import { ProgressProvider } from './ProgressContext';
import logo from './assets/batangas_state_u_logo.png'; // Assuming you'll add the logo
import bikeRentalLogo from './assets/university_bike_rental_logo.png'; // Assuming you'll add this logo

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    birthday: '',
    age: '',
    sex: '',
    grade: '',
    strand: '',
    section: '',
    address: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const endpoint = isLogin ? 'http://localhost:5000/login' : 'http://localhost:5000/signup';
    const method = 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        if (isLogin) {
          // Login successful - redirect to dashboard
          setUser(data.user);
          setIsLoggedIn(true);
        }
        // In a real app, you'd store the token (data.token) and redirect the user
      } else {
        setMessage(data.message || 'An error occurred');
      }
    } catch (error) {
      setMessage('Network error or server is down.');
      console.error('Error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentCourse(null);
    setFormData({
      fullName: '',
      username: '',
      birthday: '',
      age: '',
      sex: '',
      grade: '',
      strand: '',
      section: '',
      address: '',
      email: '',
      password: ''
    });
    setMessage('');
  };

  const handleCourseSelect = (course) => {
    setCurrentCourse(course);
  };

  const handleBackToDashboard = () => {
    setCurrentCourse(null);
  };

  // If user is logged in and viewing a course, show course lecture
  if (isLoggedIn && user && currentCourse) {
    return (
      <ProgressProvider>
        <CourseLecture course={currentCourse} onBack={handleBackToDashboard} />
      </ProgressProvider>
    );
  }

  // If user is logged in, show dashboard
  if (isLoggedIn && user) {
    return (
      <ProgressProvider>
        <Dashboard user={user} onLogout={handleLogout} onCourseSelect={handleCourseSelect} />
      </ProgressProvider>
    );
  }

  return (
    <ProgressProvider>
      <div className="login-page">
        <div className="codelab-branding">
          <div className="university-bike-rental-header">
            <img src={bikeRentalLogo} alt="University Bike Rental Logo" className="bike-rental-logo" />
            <div className="university-bike-rental-text">
              <h2>CodeLab</h2>
              <p>Think. Code. Create</p>
            </div>
          </div>
        </div>
        <div className="login-container">
          <div className="logo-section">
            <img src={logo} alt="Batangas State University Logo" className="bsu-logo" />
          </div>
          <div className="login-form-section">
            <h3>Please {isLogin ? 'Log In' : 'Sign Up'}</h3>
          <form className="login-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-user"></i>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-at"></i>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-calendar"></i>
                    <input 
                      type="date" 
                      placeholder="Birthday" 
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-birthday-cake"></i>
                    <input 
                      type="number" 
                      placeholder="Age" 
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-venus-mars"></i>
                    <select 
                      name="sex"
                      value={formData.sex}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <i className="fas fa-graduation-cap"></i>
                    <input 
                      type="text" 
                      placeholder="Grade" 
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <i className="fas fa-book"></i>
                    <input 
                      type="text" 
                      placeholder="Strand" 
                      name="strand"
                      value={formData.strand}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-users"></i>
                    <input 
                      type="text" 
                      placeholder="Section" 
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-single">
                  <div className="input-group">
                    <i className="fas fa-map-marker-alt"></i>
                    <input 
                      type="text" 
                      placeholder="Address" 
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-row">
              <div className="input-group">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  placeholder="Email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="input-group">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  placeholder="Password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <i className="fas fa-eye"></i>
              </div>
            </div>
            <p className="password-case-sensitive">* Password is case sensitive</p>
            {message && <p className="form-message">{message}</p>}
            <button type="submit" className="sign-in-button">{isLogin ? 'Sign In' : 'Sign Up'}</button>
            {isLogin ? (
              <a href="#" className="forgot-password">Forgot password?</a>
            ) : null}
            <p className="signup-text">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <a href="#" className="signup-link" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
    </ProgressProvider>
  );
}

export default App;
