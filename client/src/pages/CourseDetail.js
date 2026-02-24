import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courseAPI, noteAPI } from '../services/api';
import Header from '../components/Header';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchCourseData(); }, [id]);

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
      alert(`Failed to create note.\nError: ${error.message}`);
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
    if (window.confirm('Delete this note permanently?')) {
      try {
        await noteAPI.delete(noteId);
        setNotes(notes.filter(n => n.id !== noteId));
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const getNoteIcon = (noteTitle) => {
    const icons = ['📝', '📄', '📋', '🗒️', '📑', '📖', '🔖', '📚'];
    return icons[noteTitle.length % icons.length];
  };

  const getCourseIcon = (courseName) => {
    const icons = ['📚', '🎓', '📖', '📝', '🔬', '💻', '🎨', '📊'];
    return icons[courseName.length % icons.length];
  };


  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading loading-lg" style={{ margin: '0 auto 1.5rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="App">
        <Header />
        <div className="container">
          <div className="empty-state fade-in">
            <span className="empty-state-icon">❌</span>
            <h3>Course not found</h3>
            <p>This course doesn't exist or has been deleted.</p>
            <Link to="/" className="btn btn-lg">← Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <div className="container">

        {/* Breadcrumb */}
        <nav className="breadcrumb fade-in">
          <span className="breadcrumb-item">
            <Link to="/">Dashboard</Link>
          </span>
          <span className="breadcrumb-item active">{course.name}</span>
        </nav>

        {/* Course Hero */}
        <div className="hero-banner fade-in" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '52px', height: '52px',
              background: 'var(--grad-primary)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              flexShrink: 0
            }}>
              {getCourseIcon(course.name)}
            </div>
            <div className="hero-title" style={{ margin: 0 }}>{course.name}</div>
          </div>
          {course.description && (
            <div className="hero-subtitle">{course.description}</div>
          )}
        </div>

        {/* Stats */}
        <div className="stats-grid fade-in">
          <div className="stat-card">
            <div className="stat-number">{notes.length}</div>
            <div className="stat-label">Total Notes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{notes.filter(n => n.summary).length}</div>
            <div className="stat-label">AI Summaries</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{notes.filter(n => n.pdf_path).length}</div>
            <div className="stat-label">PDFs Attached</div>
          </div>
        </div>

        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div className="page-title" style={{ margin: 0 }}>Notes</div>
          {!showForm && notes.length > 0 && (
            <button className="btn" id="add-note-btn" onClick={() => setShowForm(true)}>
              <span>➕</span> New Note
            </button>
          )}
        </div>

        {/* Create Note Form */}
        {showForm && (
          <div className="form-container fade-in">
            <div className="form-title">
              <div className="form-icon">📝</div>
              Create New Note
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Note Title *</label>
                <input
                  id="note-title-input"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter note title..."
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Note Content</label>
                <textarea
                  id="note-body-input"
                  className="form-textarea"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows="7"
                  placeholder="Enter your study notes here..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">📄 PDF Attachment (Optional)</label>
                <input
                  id="note-pdf-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{
                    padding: '0.875rem 1rem',
                    border: '1px dashed var(--border-bright)',
                    borderRadius: 'var(--radius-md)',
                    width: '100%',
                    background: 'var(--bg-glass)',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem'
                  }}
                />
                {selectedFile && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.875rem 1rem',
                    background: 'rgba(52,211,153,0.08)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>📄</span>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--secondary)' }}>{selectedFile.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-lg" disabled={formLoading} id="create-note-submit">
                  {formLoading ? <><div className="loading"></div> Creating...</> : '✅ Create Note'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={() => { setShowForm(false); setFormData({ title: '', body: '' }); setSelectedFile(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes Grid / Empty */}
        {notes.length === 0 && !showForm ? (
          <div className="empty-state fade-in">
            <span className="empty-state-icon">📝</span>
            <h3>No notes yet</h3>
            <p>Start adding notes to this course to organize your study materials.</p>
            <button className="btn btn-lg" id="first-note-btn" onClick={() => setShowForm(true)}>
              ✍️ Create Your First Note
            </button>
          </div>
        ) : (
          <div className="note-list">
            {notes.map((note, index) => (
              <div key={note.id} className="note-card fade-in" style={{ animationDelay: `${index * 0.06}s` }}>
                <Link to={`/note/${note.id}`} style={{ textDecoration: 'none' }}>
                  <div className="note-title">
                    <div className="note-icon">{getNoteIcon(note.title)}</div>
                    {note.title}
                  </div>
                  {note.body && (
                    <div className="note-preview">
                      {note.body.substring(0, 160)}{note.body.length > 160 && '…'}
                    </div>
                  )}
                </Link>
                <div className="note-meta">
                  <span>📅 {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <div className="note-badges">
                    {note.summary && <span className="badge badge-primary">🤖 AI Summary</span>}
                    {note.pdf_path && <span className="badge badge-secondary">📄 PDF</span>}
                    <button
                      className="btn btn-danger btn-sm"
                      id={`delete-note-${note.id}`}
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showForm && (
          <button className="floating-btn" id="floating-add-note-btn" onClick={() => setShowForm(true)} title="Add New Note">
            ➕
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
