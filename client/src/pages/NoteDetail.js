import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { noteAPI, courseAPI } from '../services/api';
import Header from '../components/Header';

const NoteDetail = () => {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizVisible, setQuizVisible] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [course, setCourse] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => { fetchNote(); }, [id]);

  const fetchNote = async () => {
    try {
      const response = await noteAPI.getById(id);
      const noteData = response.data.data;
      setNote(noteData);
      setFormData({ title: noteData.title, body: noteData.body || '' });
      if (noteData.course_id) {
        try {
          const courseResponse = await courseAPI.getById(noteData.course_id);
          setCourse(courseResponse.data.data);
        } catch (err) {
          console.error('Error fetching course:', err);
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
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
      alert(`Failed to generate summary.\nError: ${error.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  const handleCancel = () => {
    setFormData({ title: note.title, body: note.body || '' });
    setEditing(false);
  };

  const handleToggleReview = async () => {
    setReviewLoading(true);
    try {
      const response = await noteAPI.toggleReview(id);
      if (response.data.success) setNote(response.data.data);
    } catch (error) {
      console.error('Error toggling review:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    try {
      const response = await noteAPI.generateQuiz(id);
      if (response.data.success) {
        setNote(prev => ({ ...prev, quiz: JSON.stringify(response.data.data.quiz) }));
        setQuizVisible(true);
        setRevealedAnswers({});
      } else {
        alert(`Failed to generate quiz: ${response.data.error}`);
      }
    } catch (error) {
      alert(`Failed to generate quiz.\nError: ${error.message}`);
    } finally {
      setQuizLoading(false);
    }
  };

  const toggleAnswer = (idx) => {
    setRevealedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const parsedQuiz = (() => {
    try { return note?.quiz ? JSON.parse(note.quiz) : null; }
    catch { return null; }
  })();

  const getNoteIcon = (noteTitle) => {
    const icons = ['📝', '📄', '📋', '🗒️', '📑', '📖', '🔖', '📚'];
    return icons[noteTitle.length % icons.length];
  };



  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading loading-lg" style={{ margin: '0 auto 1.5rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading note...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="App">
        <Header />
        <div className="container">
          <div className="empty-state fade-in">
            <span className="empty-state-icon">❌</span>
            <h3>Note not found</h3>
            <p>This note doesn't exist or has been deleted.</p>
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
          {course && (
            <span className="breadcrumb-item">
              <Link to={`/course/${course.id}`}>{course.name}</Link>
            </span>
          )}
          <span className="breadcrumb-item active">{note.title}</span>
        </nav>

        {/* Note Editor Card */}
        <div className="note-editor fade-in">
          <div className="editor-header">
            <div className="editor-title">
              <div className="note-icon" style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}>
                {getNoteIcon(note.title)}
              </div>
              Note Editor
            </div>
            <div className="editor-actions">
              {saveSuccess && (
                <span style={{
                  color: 'var(--secondary)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  ✅ Saved!
                </span>
              )}
              {!editing ? (
                <>
                  <button className="btn btn-secondary" id="edit-note-btn" onClick={() => setEditing(true)}>
                    ✏️ Edit
                  </button>
                  <button
                    className={`btn ${note.is_reviewed ? 'btn-success' : 'btn-secondary'}`}
                    id="review-toggle-btn"
                    onClick={handleToggleReview}
                    disabled={reviewLoading}
                    title={note.is_reviewed ? 'Mark as not reviewed' : 'Mark as reviewed'}
                  >
                    {reviewLoading ? <><div className="loading"></div></> : (note.is_reviewed ? '✅ Reviewed' : '⬜ Mark Reviewed')}
                  </button>
                  <button
                    className="btn btn-success"
                    id="summarize-btn"
                    onClick={handleSummarize}
                    disabled={summarizing || !note.body}
                    title={!note.body ? 'Add content first to summarize' : 'Generate AI summary'}
                  >
                    {summarizing ? (
                      <><div className="loading"></div><span>Summarizing...</span></>
                    ) : (
                      <><span>🤖</span><span>AI Summarize</span></>
                    )}
                  </button>
                  <button
                    className="btn"
                    id="quiz-btn"
                    onClick={handleGenerateQuiz}
                    disabled={quizLoading || !note.body}
                    title={!note.body ? 'Add content first' : 'Generate quiz questions'}
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 4px 14px rgba(245,158,11,0.4)' }}
                  >
                    {quizLoading ? <><div className="loading"></div><span>Generating...</span></> : <><span>🧠</span><span>Generate Quiz</span></>}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn" id="save-note-btn" onClick={handleSave} disabled={saving}>
                    {saving ? <><div className="loading"></div> Saving...</> : '💾 Save'}
                  </button>
                  <button className="btn btn-secondary" id="cancel-edit-btn" onClick={handleCancel}>
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title</label>
            {editing ? (
              <input
                id="edit-title-input"
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Note title..."
              />
            ) : (
              <div style={{
                fontSize: '1.6rem',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1.3,
                padding: '0.5rem 0'
              }}>
                {note.title}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="form-group">
            <label className="form-label">Content</label>
            {editing ? (
              <textarea
                id="edit-body-input"
                className="form-textarea"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows="14"
                placeholder="Write your study notes here..."
              />
            ) : (
              <div style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                minHeight: '160px'
              }}>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  margin: 0,
                  lineHeight: '1.75',
                  color: note.body ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.95rem'
                }}>
                  {note.body || 'No content yet. Click Edit to add your notes.'}
                </pre>
              </div>
            )}
          </div>

          {/* PDF Attachment */}
          {note.pdf_path && (
            <div className="form-group">
              <label className="form-label">📄 PDF Attachment</label>
              <div style={{
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(52,211,153,0.15)' }}>
                  <a
                    href={noteAPI.getPDF(note.pdf_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    id="open-pdf-btn"
                    style={{ fontSize: '0.875rem', padding: '0.6rem 1.2rem' }}
                  >
                    <span>📄</span><span>Open PDF in New Tab</span>
                  </a>
                </div>
                <iframe
                  src={noteAPI.getPDF(note.pdf_path)}
                  style={{ width: '100%', height: '520px', border: 'none', display: 'block' }}
                  title="PDF Preview"
                />
              </div>
            </div>
          )}

          {/* AI Summary */}
          {note.summary && (
            <div className="summary-card fade-in">
              <div className="summary-title">
                <span>🤖</span>
                <span>AI-Generated Summary</span>
              </div>
              <div className="summary-content">
                {note.summary.split('\n').map((line, index) => {
                  const bulletMatch = line.match(/^[•*\-]\s*(.+)/);
                  if (bulletMatch) {
                    return (
                      <div key={index} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: '700', flexShrink: 0, marginTop: '0.05rem' }}>•</span>
                        <span>{bulletMatch[1]}</span>
                      </div>
                    );
                  }
                  return line.trim()
                    ? <p key={index} style={{ margin: '0.3rem 0', color: 'var(--text-secondary)' }}>{line}</p>
                    : null;
                })}
              </div>
            </div>
          )}

          {/* Quiz Section */}
          {parsedQuiz && quizVisible && (
            <div className="quiz-section fade-in">
              <div className="quiz-header">
                <div className="quiz-title"><span>🧠</span> Practice Quiz</div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setRevealedAnswers({})}>
                    🔄 Reset
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setQuizVisible(false)}>
                    ✕ Hide
                  </button>
                </div>
              </div>
              <div className="quiz-cards">
                {parsedQuiz.map((item, idx) => (
                  <div key={idx} className="quiz-card">
                    <div className="quiz-q"><span className="quiz-num">Q{idx + 1}</span>{item.question}</div>
                    <button
                      className={`quiz-reveal-btn ${revealedAnswers[idx] ? 'revealed' : ''}`}
                      onClick={() => toggleAnswer(idx)}
                    >
                      {revealedAnswers[idx] ? (
                        <><span className="quiz-answer-label">Answer:</span> {item.answer}</>
                      ) : (
                        '👁️ Reveal Answer'
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
                {Object.keys(revealedAnswers).length} of {parsedQuiz.length} answers revealed
              </p>
            </div>
          )}

          {/* Metadata Footer */}
          <div style={{
            marginTop: '2rem',
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-glass)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span>📅 Created: {new Date(note.created_at).toLocaleString()}</span>
              <span>🔄 Updated: {new Date(note.updated_at).toLocaleString()}</span>
            </div>
            <div className="note-badges">
              {note.is_reviewed && <span className="badge badge-success">✅ Reviewed</span>}
              {note.summary && <span className="badge badge-primary">🤖 AI Summary</span>}
              {note.quiz && <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)' }}>🧠 Quiz</span>}
              {note.pdf_path && <span className="badge badge-secondary">📄 PDF</span>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NoteDetail;
