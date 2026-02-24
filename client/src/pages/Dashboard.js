import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI, noteAPI } from '../services/api';

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchNotes();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      setCourses(response.data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await noteAPI.getAll();
      setNotes(response.data.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCourses(), fetchNotes()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const response = await courseAPI.create(formData);
      setCourses([...courses, response.data.data]);
      setFormData({ name: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? All notes will be deleted as well.')) {
      try {
        await courseAPI.delete(courseId);
        setCourses(courses.filter(course => course.id !== courseId));
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const getCourseIcon = (courseName) => {
    const icons = ['📚', '🎓', '📖', '📝', '🔬', '�', '🎨', '�'];
    const index = courseName.length % icons.length;
    return icons[index];
  };

  const getNoteCount = (courseId) => {
    // Get actual note count from the notes data
    const courseNotes = notes.filter(note => note.course_id === courseId);
    return courseNotes.length;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <h1>StudyBuddy</h1>
          <div className="subtitle">Your AI-powered study organization tool</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="loading loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>StudyBuddy</h1>
          <div className="subtitle">Your AI-powered study organization tool</div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{courses.length}</div>
            <div className="stat-label">Total Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{courses.reduce((acc, course) => acc + getNoteCount(course.id), 0)}</div>
            <div className="stat-label">Total Notes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{courses.filter(course => getNoteCount(course.id) > 0).length}</div>
            <div className="stat-label">Active Courses</div>
          </div>
        </div>
        
        <div className="page-title">My Courses</div>
        
        {showForm && (
          <div className="form-container fade-in">
            <div className="form-title">
              <div className="form-icon">➕</div>
              Create New Course
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Course Name *</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Computer Science 101"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Brief description of the course..."
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-lg" disabled={formLoading}>
                  {formLoading ? <div className="loading"></div> : 'Create Course'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-lg" 
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {!showForm && (
          <button className="btn btn-lg" onClick={() => setShowForm(true)}>
            <span>➕</span> Add New Course
          </button>
        )}
        
        {courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>No courses yet</h3>
            <p>Start organizing your study materials by creating your first course.</p>
            <button className="btn btn-lg" onClick={() => setShowForm(true)}>
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="course-list">
            {courses.map((course, index) => (
              <div key={course.id} className="course-card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <Link to={`/course/${course.id}`} style={{ textDecoration: 'none' }}>
                  <div className="course-title">
                    <div className="course-icon">{getCourseIcon(course.name)}</div>
                    {course.name}
                  </div>
                  {course.description && (
                    <div className="course-description">{course.description}</div>
                  )}
                </Link>
                <div className="course-meta">
                  <div className="course-stats">
                    <div className="stat-item">
                      <span>📝</span>
                      <span>{getNoteCount(course.id)} notes</span>
                    </div>
                    <div className="stat-item">
                      <span>📅</span>
                      <span>{new Date(course.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(course.id);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!showForm && courses.length > 0 && (
          <button className="floating-btn" onClick={() => setShowForm(true)} title="Add New Course">
            ➕
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
