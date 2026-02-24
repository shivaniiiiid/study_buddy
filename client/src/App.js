import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import NoteDetail from './pages/NoteDetail';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/note/:id" element={<NoteDetail />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
