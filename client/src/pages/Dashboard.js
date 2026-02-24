import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI, noteAPI } from '../services/api';
import Header from '../components/Header';

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCourses(), fetchNotes()]);
      setLoading(false);
    };
    loadData();
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
    if (window.confirm('Delete this course? All notes will be permanently removed.')) {
      try {
        await courseAPI.delete(courseId);
        setCourses(courses.filter(c => c.id !== courseId));
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const getCourseIcon = (courseName) => {
    const icons = ['📚', '🎓', '📖', '📝', '🔬', '💻', '🎨', '📊'];
    return icons[courseName.length % icons.length];
  };

  const getNoteCount = (courseId) =>
    notes.filter(n => n.course_id === courseId).length;

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading loading-lg" style={{ margin: '0 auto 1.5rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your study space...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalNotes = courses.reduce((acc, c) => acc + getNoteCount(c.id), 0);
  const activeCourses = courses.filter(c => getNoteCount(c.id) > 0).length;
  const reviewedNotes = notes.filter(n => n.is_reviewed).length;

  const q = searchQuery.toLowerCase().trim();
  const filteredCourses = q
    ? courses.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    )
    : courses;
  const filteredNotes = q
    ? notes.filter(n => n.title.toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q))
    : [];

  return (
    <div className="App">
      <Header />

      <div className="container">
        {/* Hero */}
        <div className="hero-banner fade-in">
          <div className="hero-title">Welcome back! 👋</div>
          <div className="hero-subtitle">
            {courses.length === 0
              ? 'Start your learning journey — create your first course below.'
              : `You have ${courses.length} course${courses.length !== 1 ? 's' : ''} and ${totalNotes} note${totalNotes !== 1 ? 's' : ''}. Keep it up!`}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid fade-in">
          <div className="stat-card">
            <div className="stat-number">{courses.length}</div>
            <div className="stat-label">Total Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalNotes}</div>
            <div className="stat-label">Total Notes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{activeCourses}</div>
            <div className="stat-label">Active Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ background: 'var(--grad-green)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{reviewedNotes}</div>
            <div className="stat-label">Reviewed ✅</div>
          </div>
        </div>

        {/* Search Bar */}
        {courses.length > 0 && (
          <div className="search-bar fade-in">
            <span className="search-icon">🔍</span>
            <input
              id="dashboard-search"
              type="text"
              className="search-input"
              placeholder="Search courses and notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} title="Clear search">✕</button>
            )}
          </div>
        )}

        {/* Section Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div className="page-title" style={{ margin: 0 }}>My Courses</div>
          {!showForm && courses.length > 0 && (
            <button className="btn" onClick={() => setShowForm(true)} id="add-course-btn">
              <span>➕</span> New Course
            </button>
          )}
        </div>

        {/* Create Course Form */}
        {showForm && (
          <div className="form-container fade-in">
            <div className="form-title">
              <div className="form-icon">📚</div>
              Create New Course
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Course Name *</label>
                <input
                  id="course-name-input"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Science 101"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  id="course-desc-input"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Brief description of this course..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-lg" disabled={formLoading} id="create-course-submit">
                  {formLoading ? <><div className="loading"></div> Creating...</> : '✅ Create Course'}
                </button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State */}
        {courses.length === 0 && !showForm ? (
          <div className="empty-state fade-in">
            <span className="empty-state-icon">📚</span>
            <h3>No courses yet</h3>
            <p>Start organizing your study materials by creating your first course.</p>
            <button className="btn btn-lg" id="first-course-btn" onClick={() => setShowForm(true)}>
              🚀 Create Your First Course
            </button>
          </div>
        ) : (
          <>
            {/* Matching Notes (shown only during search) */}
            {filteredNotes.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div className="page-title" style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                  📝 Matching Notes ({filteredNotes.length})
                </div>
                <div className="note-list">
                  {filteredNotes.map(note => (
                    <Link key={note.id} to={`/note/${note.id}`} style={{ textDecoration: 'none' }}>
                      <div className="note-card">
                        <div className="note-title">
                          <div className="note-icon">📝</div>
                          {note.title}
                          {note.is_reviewed ? <span className="badge badge-success" style={{ marginLeft: 'auto' }}>✅ Reviewed</span> : null}
                        </div>
                        {note.body && <div className="note-preview">{note.body.substring(0, 120)}…</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Course List */}
            {filteredCourses.length === 0 && q ? (
              <div className="empty-state fade-in">
                <span className="empty-state-icon">🔍</span>
                <h3>No results found</h3>
                <p>No courses match "<strong>{searchQuery}</strong>". Try a different search term.</p>
                <button className="btn" onClick={() => setSearchQuery('')}>Clear Search</button>
              </div>
            ) : (
              <div className="course-list">
                {filteredCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="course-card fade-in"
                    style={{ animationDelay: `${index * 0.07}s` }}
                  >
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
                          <span>{getNoteCount(course.id)} note{getNoteCount(course.id) !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="stat-item">
                          <span>📅</span>
                          <span>{new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        id={`delete-course-${course.id}`}
                        onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Floating Add Button */}
        {!showForm && courses.length > 0 && (
          <button className="floating-btn" id="floating-add-btn" onClick={() => setShowForm(true)} title="Add New Course">
            ➕
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
