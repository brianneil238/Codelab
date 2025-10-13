# CodeLab - Learning Platform

A simple coding learning platform built for students to learn HTML, C++, and Python programming languages.

## What is CodeLab?

CodeLab is a web application that helps students learn programming through interactive lessons, quizzes, and a code editor. Students can track their progress and practice coding directly in the browser.

## How This Website Was Built

### Frontend (What Users See)
- **React.js** - A JavaScript library that makes it easy to build interactive web pages
- **HTML & CSS** - The basic building blocks of any website
- **Vite** - A tool that helps developers build and test websites quickly

### Backend (The Server)
- **Node.js** - A JavaScript runtime that runs on the server
- **Express.js** - A framework that makes it easy to create web servers
- **PostgreSQL** - A database that stores user information securely

### Database
- **Neon PostgreSQL** - A cloud database service that stores user accounts and progress

## Features

### For Students
- **User Registration** - Create an account with personal information
- **Login System** - Secure login with email and password
- **Course Selection** - Choose from HTML, C++, or Python courses
- **Interactive Lessons** - Step-by-step learning with explanations
- **Code Editor** - Practice coding with live preview
- **Quizzes** - Test your knowledge after each lesson
- **Progress Tracking** - See how much you've learned

### For Teachers
- **Student Management** - View student progress and completion rates
- **Course Content** - Structured lessons for different programming languages

## How to Use This Website

### For Students
1. **Sign Up** - Create your account with your school information
2. **Log In** - Use your email and password to access the platform
3. **Choose a Course** - Select HTML, C++, or Python to start learning
4. **Take Lessons** - Follow the step-by-step instructions
5. **Practice Coding** - Use the built-in code editor to write and test code
6. **Take Quizzes** - Test your understanding after each lesson
7. **Track Progress** - See your learning progress in the dashboard

### For Teachers
1. **Monitor Students** - Check student progress and completion rates
2. **Review Performance** - See quiz results and learning analytics
3. **Guide Learning** - Help students who are struggling with concepts

## Technical Details (For Developers)

### Project Structure
```
CodeLab/
├── src/                    # Frontend React components
│   ├── App.jsx            # Main application component
│   ├── Dashboard.jsx      # Student dashboard
│   ├── CourseLecture.jsx  # Course content display
│   ├── CodeEditor.jsx     # Interactive code editor
│   ├── Quiz.jsx          # Quiz functionality
│   └── ProgressContext.jsx # Progress tracking
├── server/                # Backend Node.js server
│   └── index.js          # Server setup and API routes
└── public/                # Static assets (images, etc.)
```

### Key Technologies Used
- **Frontend**: React, HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel (Frontend), Render (Backend)

### API Endpoints
- `POST /signup` - Create new user account
- `POST /login` - User authentication
- `GET /health` - Server health check

## How to Run This Project Locally

### Prerequisites
- Node.js installed on your computer
- A code editor (like VS Code)
- Git for version control

### Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/brianneil238/Codelab.git
   cd Codelab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the `server` folder
   - Add your database connection string and JWT secret

4. **Start the development servers**
   ```bash
   # Start the backend server
   cd server
   npm start
   
   # Start the frontend server (in a new terminal)
   npm run dev
   ```

5. **Open your browser**
   - Go to `http://localhost:5173` to see the website

## Learning Objectives

### What Students Will Learn
- **HTML** - How to create web pages and structure content
- **C++** - Programming fundamentals and problem-solving
- **Python** - Modern programming language for various applications
- **Web Development** - How websites work and are built
- **Problem Solving** - Logical thinking and debugging skills

### Skills Developed
- **Coding** - Writing and understanding programming code
- **Critical Thinking** - Analyzing problems and finding solutions
- **Persistence** - Working through challenges and debugging
- **Digital Literacy** - Understanding how technology works

## Future Improvements

### Planned Features
- **More Programming Languages** - JavaScript, Java, and more
- **Advanced Projects** - Build real applications
- **Collaboration Tools** - Work on projects with classmates
- **Certificates** - Earn certificates for completed courses
- **Mobile App** - Learn on your phone or tablet

### Technical Improvements
- **Better Performance** - Faster loading and smoother experience
- **Offline Mode** - Learn without internet connection
- **AI Tutoring** - Get personalized help and feedback
- **Gamification** - Earn points, badges, and achievements

## Contributing

### For Students
- Report bugs or suggest new features
- Share your learning experience
- Help other students in the community

### For Teachers
- Provide feedback on course content
- Suggest improvements for the learning experience
- Contribute additional lesson materials

## Support

If you need help or have questions:
- Check the FAQ section
- Contact your teacher
- Email support at [support@codelab.com]

## License

This project is created for educational purposes. Feel free to use and modify for learning.

---

**Remember**: Learning to code is like learning a new language. It takes practice, patience, and persistence. Don't give up if you find it challenging at first - every programmer started where you are now!

Happy coding! 🚀