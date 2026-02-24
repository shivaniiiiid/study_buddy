import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { noteAPI, courseAPI } from '../services/api';

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await noteAPI.getById(id);
      const noteData = response.data.data;
      setNote(noteData);
      setFormData({ title: noteData.title, body: noteData.body || '' });
      
      // Fetch course info for breadcrumb
      if (noteData.course_id) {
        try {
          const courseResponse = await courseAPI.getById(noteData.course_id);
          setCourse(courseResponse.data.data);
        } catch (error) {
          console.error('Error fetching course:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await noteAPI.update(id, formData);
      setNote(response.data.data);
      setEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const response = await noteAPI.summarize(id);
      if (response.data.success) {
        setNote(response.data.data.note);
      } else {
        alert(`Failed to generate summary: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error summarizing note:', error);
      alert(`Failed to generate summary. Please try again.\nError: ${error.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  const handleCancel = () => {
    setFormData({ title: note.title, body: note.body || '' });
    setEditing(false);
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

  if (!note) {
    return (
      <div className="App">
        <div className="container">
          <div className="header">
            <h1>StudyBuddy</h1>
            <div className="subtitle">Your AI-powered study organization tool</div>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3>Note not found</h3>
            <p>The note you're looking for doesn't exist or has been deleted.</p>
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
          {course && (
            <span className="breadcrumb-item">
              <Link to={`/course/${course.id}`}>{course.name}</Link>
            </span>
          )}
          <span className="breadcrumb-item active">{note.title}</span>
        </nav>
        
        <div className="note-editor">
          <div className="editor-header">
            <div className="editor-title">
              <div className="note-icon" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                {getNoteIcon(note.title)}
              </div>
              Note Details
            </div>
            <div className="editor-actions">
              {!editing && (
                <>
                  <button className="btn" onClick={() => setEditing(true)}>
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={handleSummarize}
                    disabled={summarizing || !note.body}
                  >
                    {summarizing ? (
                      <>
                        <div className="loading"></div>
                        <span>Summarizing...</span>
                      </>
                    ) : (
                      <>
                        <span>🤖</span>
                        <span>Summarize</span>
                      </>
                    )}
                  </button>
                </>
              )}
              {editing && (
                <>
                  <button 
                    className="btn" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <div className="loading"></div> : '💾 Save'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    ❌ Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">📝 Title</label>
            {editing ? (
              <div className="input-group">
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter note title..."
                />
              </div>
            ) : (
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div className="note-icon" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>
                  {getNoteIcon(note.title)}
                </div>
                {note.title}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">📄 Content</label>
            {editing ? (
              <textarea
                className="form-textarea"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows="12"
                placeholder="Enter your study notes here..."
              />
            ) : (
              <div className="card">
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'inherit', 
                  margin: 0,
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}>
                  {note.body || 'No content yet. Click Edit to add content.'}
                </pre>
              </div>
            )}
          </div>
          
          {note.pdf_path && (
            <div className="form-group">
              <label className="form-label">📄 PDF Attachment</label>
              <div className="card">
                <div style={{ marginBottom: '1rem' }}>
                  <a 
                    href={noteAPI.getPDF(note.pdf_path)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span>📄</span>
                    <span>Open PDF in New Tab</span>
                  </a>
                </div>
                <div style={{ 
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'var(--surface)'
                }}>
                  <iframe
                    src={noteAPI.getPDF(note.pdf_path)}
                    style={{ 
                      width: '100%', 
                      height: '500px', 
                      border: 'none',
                      display: 'block'
                    }}
                    title="PDF Preview"
                  />
                </div>
              </div>
            </div>
          )}
          
          {note.summary && (
            <div className="summary-card fade-in">
              <div className="summary-title">
                <span>🤖</span>
                <span>AI Summary</span>
              </div>
              <div 
                className="summary-content"
                dangerouslySetInnerHTML={{ 
                  __html: note.summary.replace(/\n/g, '<br>').replace(/\* (.+)/g, '<li>$1</li>').replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>') 
                }}
              />
            </div>
          )}
          
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem',
            background: 'var(--background)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span>📅</span>
                <span>Created: {new Date(note.created_at).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔄</span>
                <span>Last updated: {new Date(note.updated_at).toLocaleString()}</span>
              </div>
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;
