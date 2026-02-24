import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courseAPI, noteAPI } from '../services/api';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const [courseResponse, notesResponse] = await Promise.all([
        courseAPI.getById(id),
        noteAPI.getByCourse(id)
      ]);
      setCourse(courseResponse.data.data);
      setNotes(notesResponse.data.data);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const response = await noteAPI.create(id, formData, selectedFile);
      if (response.data.success) {
        setNotes([...notes, response.data.data]);
        setFormData({ title: '', body: '' });
        setSelectedFile(null);
        setShowForm(false);
      } else {
        alert(`Error creating note: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert(`Failed to create note. Please try again.\nError: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Please select a PDF file only.');
        e.target.value = '';
      }
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await noteAPI.delete(noteId);
        setNotes(notes.filter(note => note.id !== noteId));
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const getNoteIcon = (noteTitle) => {
    const icons = ['📝', '📄', '📋', '🗒️', '📑', '📖', '🔖', '📚'];
    const index = noteTitle.length % icons.length;
    return icons[index];
  };

  const getCourseIcon = (courseName) => {
    const icons = ['📚', '🎓', '📖', '📝', '🔬', '💻', '🎨', '📊'];
    const index = courseName.length % icons.length;
    return icons[index];
  };

  if (loading) {
    return (
      <div className="App">
        <div className="container">
          <div className="header">
            <h1>StudyBuddy</h1>
            <div className="subtitle">Your AI-powered study organization tool</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div className="loading loading-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="App">
        <div className="container">
          <div className="header">
            <h1>StudyBuddy</h1>
            <div className="subtitle">Your AI-powered study organization tool</div>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3>Course not found</h3>
            <p>The course you're looking for doesn't exist or has been deleted.</p>
            <Link to="/" className="btn btn-lg">Back to Dashboard</Link>
          </div>
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
        
        <nav className="breadcrumb">
          <span className="breadcrumb-item">
            <Link to="/">Dashboard</Link>
          </span>
          <span className="breadcrumb-item active">{course.name}</span>
        </nav>
        
        <div className="page-title">
          <div className="course-icon" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
            {getCourseIcon(course.name)}
          </div>
          {course.name}
        </div>
        
        {course.description && (
          <div className="card fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.2rem' }}>📖</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Course Description</div>
            </div>
            <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{course.description}</p>
          </div>
        )}
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{notes.length}</div>
            <div className="stat-label">Total Notes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{notes.filter(note => note.summary).length}</div>
            <div className="stat-label">AI Summaries</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{notes.filter(note => note.pdf_path).length}</div>
            <div className="stat-label">PDF Attachments</div>
          </div>
        </div>
        
        {showForm && (
          <div className="form-container fade-in">
            <div className="form-title">
              <div className="form-icon">📝</div>
              Create New Note
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Note Title *</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter note title..."
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Note Content</label>
                <textarea
                  className="form-textarea"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows="6"
                  placeholder="Enter your study notes here..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">📄 PDF File (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ 
                      padding: '0.75rem 1rem',
                      border: '2px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      background: 'var(--surface)',
                      cursor: 'pointer'
                    }}
                  />
                  {selectedFile && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem',
                      background: 'rgb(99 102 241 / 0.05)',
                      border: '1px solid rgb(99 102 241 / 0.2)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>📄</span>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-lg" disabled={formLoading}>
                  {formLoading ? <div className="loading"></div> : 'Create Note'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-lg" 
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', body: '' });
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {!showForm && (
          <button className="btn btn-lg" onClick={() => setShowForm(true)}>
            <span>➕</span> Add New Note
          </button>
        )}
        
        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No notes yet</h3>
            <p>Start adding notes to this course to organize your study materials.</p>
            <button className="btn btn-lg" onClick={() => setShowForm(true)}>
              Create Your First Note
            </button>
          </div>
        ) : (
          <div className="note-list">
            {notes.map((note, index) => (
              <div key={note.id} className="note-card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <Link to={`/note/${note.id}`} style={{ textDecoration: 'none' }}>
                  <div className="note-title">
                    <div className="note-icon">{getNoteIcon(note.title)}</div>
                    {note.title}
                  </div>
                  {note.body && (
                    <div className="note-preview">
                      {note.body.substring(0, 150)}
                      {note.body.length > 150 && '...'}
                    </div>
                  )}
                </Link>
                <div className="note-meta">
                  <span>📅 {new Date(note.updated_at).toLocaleDateString()}</span>
                  <div className="note-badges">
                    {note.summary && (
                      <span className="badge badge-primary">
                        <span>🤖</span> AI Summary
                      </span>
                    )}
                    {note.pdf_path && (
                      <span className="badge badge-secondary">
                        <span>📄</span> PDF
                      </span>
                    )}
                  </div>
                </div>
                <div className="actions">
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!showForm && (
          <button className="floating-btn" onClick={() => setShowForm(true)} title="Add New Note">
            ➕
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
