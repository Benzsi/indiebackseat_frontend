import { useState } from 'react';
import { StarRating } from './StarRating';


interface BookBackProps {
  title: string;
  author: string;
  averageRating: number;
  totalRatings: number;
  comments: { id: number; user: string; text: string; isOwn?: boolean; }[];
  onEditComment?: (commentId: number, content: string) => Promise<void>;
  onDeleteComment?: (commentId: number) => Promise<void>;
  onReportComment?: (commentId: number) => Promise<void>;
  description?: string;
  videoUrl?: string;
}

export function BookBack({
  title,
  author,
  averageRating,
  totalRatings,
  comments,
  onEditComment,
  onDeleteComment,
  onReportComment,
  description,
  videoUrl,
}: BookBackProps) {
  const [likes, setLikes] = useState<Record<number, number>>({});
  const [dislikes, setDislikes] = useState<Record<number, number>>({});
  const [userVotes, setUserVotes] = useState<Record<number, 'like' | 'dislike' | null>>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [processingCommentId, setProcessingCommentId] = useState<number | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [hoveredActionKey, setHoveredActionKey] = useState<string | null>(null);
  const [pressedActionKey, setPressedActionKey] = useState<string | null>(null);

  const handleLike = (index: number) => {
    const currentVote = userVotes[index];
    const newLikes = { ...likes, [index]: (likes[index] || 0) + (currentVote === 'like' ? -1 : 1) };
    const newDislikes = currentVote === 'dislike' ? { ...dislikes, [index]: (dislikes[index] || 1) - 1 } : dislikes;

    setLikes(newLikes);
    setDislikes(newDislikes);
    setUserVotes({ ...userVotes, [index]: currentVote === 'like' ? null : 'like' });
  };

  const handleDislike = (index: number) => {
    const currentVote = userVotes[index];
    const newDislikes = { ...dislikes, [index]: (dislikes[index] || 0) + (currentVote === 'dislike' ? -1 : 1) };
    const newLikes = currentVote === 'like' ? { ...likes, [index]: (likes[index] || 1) - 1 } : likes;

    setDislikes(newDislikes);
    setLikes(newLikes);
    setUserVotes({ ...userVotes, [index]: currentVote === 'dislike' ? null : 'dislike' });
  };

  const startEdit = (commentId: number, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingText(currentText);
  };

  const saveEdit = async () => {
    if (!onEditComment || editingCommentId === null || !editingText.trim()) return;
    try {
      setProcessingCommentId(editingCommentId);
      await onEditComment(editingCommentId, editingText.trim());
      setEditingCommentId(null);
      setEditingText('');
      setActiveCommentId(null);
    } finally {
      setProcessingCommentId(null);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!onDeleteComment) return;
    const confirmed = window.confirm('Biztosan torolni szeretned ezt a backseatet?');
    if (!confirmed) return;
    try {
      setProcessingCommentId(commentId);
      await onDeleteComment(commentId);
    } finally {
      setProcessingCommentId(null);
    }
  };

  const reportComment = async (commentId: number) => {
    if (!onReportComment) return;
    try {
      setProcessingCommentId(commentId);
      await onReportComment(commentId);
    } finally {
      setProcessingCommentId(null);
      setActiveCommentId(null);
    }
  };

  const getActionButtonStyle = (type: 'edit' | 'delete' | 'save' | 'cancel' | 'report', actionKey: string) => {
    const palette = {
      edit: { color: '#3b82f6', glow: 'rgba(59,130,246,0.5)', bg: '#eff6ff' },
      delete: { color: '#ef4444', glow: 'rgba(239,68,68,0.5)', bg: '#fff1f2' },
      save: { color: '#16a34a', glow: 'rgba(22,163,74,0.5)', bg: '#f0fdf4' },
      cancel: { color: '#64748b', glow: 'rgba(100,116,139,0.45)', bg: '#f8fafc' },
      report: { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', bg: '#fffbeb' },
    };
    const selected = palette[type];
    const isHovered = hoveredActionKey === actionKey;
    const isPressed = pressedActionKey === actionKey;

    return {
      padding: '6px 12px',
      fontSize: 12,
      border: `1px solid ${selected.color}`,
      color: selected.color,
      background: isHovered || isPressed ? selected.bg : '#fff',
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: 700,
      boxShadow: isPressed
        ? `0 0 0 2px ${selected.glow}, 0 0 16px ${selected.glow}`
        : isHovered
          ? `0 0 12px ${selected.glow}`
          : 'none',
      transform: isPressed ? 'scale(0.98)' : 'scale(1)',
      transition: 'box-shadow 0.2s, background 0.2s, transform 0.08s',
    };
  };

  return (
    <div className="book-back" style={{ position: 'relative', height: '100%', opacity: 1, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', padding: '24px 18px 18px 18px' }}>
      <h3>{title}</h3>
      <div style={{ fontStyle: 'italic', color: '#666', marginBottom: 12 }}>{author}</div>

      <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #eee' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: 4 }}>Átlagos értékelés:</div>
        <StarRating rating={averageRating} totalRatings={totalRatings} readonly size="medium" />
      </div>

      <div style={{ marginBottom: 12, padding: 12, border: '1px solid #eee', borderRadius: 8, backgroundColor: '#fafafa' }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '14px' }}>Leírás</div>
        <div style={{ color: '#444', fontSize: 14, lineHeight: 1.5 }}>
          {description?.trim() || 'Ide kerulhet a konyv rovid leirasa.'}
        </div>
      </div>

      <div style={{ marginBottom: 12, padding: 12, border: '1px dashed #c7ced8', borderRadius: 8, backgroundColor: '#f6f9ff' }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '14px' }}>Video</div>
        {videoUrl ? (
          <a href={videoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: 14 }}>
            Video megnyitasa
          </a>
        ) : (
          <div style={{ color: '#667085', fontSize: 14 }}>
            Fenntartott hely: ide kerulhet elozetes vagy ajanlo video.
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '14px' }}>Backseating ({comments.length})</div>
        {comments.length === 0 ? (
          <div style={{ color: '#888', fontSize: 13 }}>Még nincs backseating.</div>
        ) : (
          <div style={{
            overflow: 'auto',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 8,
            paddingRight: 8,
          }}>
            {comments.map((c, i) => {
              const showActions = c.isOwn && (activeCommentId === c.id || editingCommentId === c.id);
              const isEditingThisComment = editingCommentId === c.id;

              return (
                <div
                  key={c.id}
                  style={{
                    fontSize: '14px',
                    padding: '10px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '6px',
                    borderLeft: '3px solid var(--color-primary)',
                    position: 'relative',
                    cursor: c.isOwn ? 'pointer' : 'default',
                    overflow: 'hidden',
                    width: '100%',
                    minHeight: 120,
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                  onClick={() => {
                    if (!c.isOwn) return;
                    setActiveCommentId((prev) => (prev === c.id ? null : c.id));
                  }}
                >
                  {showActions ? (
                    <div
                      style={
                        isEditingThisComment
                          ? {
                            position: 'absolute',
                            right: 10,
                            bottom: 10,
                            zIndex: 3,
                            pointerEvents: 'none',
                          }
                          : {
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3,
                            pointerEvents: 'none',
                          }
                      }
                    >
                      <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
                        {isEditingThisComment ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void saveEdit();
                              }}
                              onMouseEnter={() => setHoveredActionKey(`save-${c.id}`)}
                              onMouseLeave={() => {
                                setHoveredActionKey(null);
                                setPressedActionKey(null);
                              }}
                              onMouseDown={() => setPressedActionKey(`save-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              disabled={processingCommentId === c.id || !editingText.trim()}
                              style={getActionButtonStyle('save', `save-${c.id}`)}
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCommentId(null);
                                setEditingText('');
                              }}
                              onMouseEnter={() => setHoveredActionKey(`cancel-${c.id}`)}
                              onMouseLeave={() => {
                                setHoveredActionKey(null);
                                setPressedActionKey(null);
                              }}
                              onMouseDown={() => setPressedActionKey(`cancel-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              style={getActionButtonStyle('cancel', `cancel-${c.id}`)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(c.id, c.text);
                              }}
                              onMouseEnter={() => setHoveredActionKey(`edit-${c.id}`)}
                              onMouseLeave={() => {
                                setHoveredActionKey(null);
                                setPressedActionKey(null);
                              }}
                              onMouseDown={() => setPressedActionKey(`edit-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              style={getActionButtonStyle('edit', `edit-${c.id}`)}
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void deleteComment(c.id);
                              }}
                              onMouseEnter={() => setHoveredActionKey(`delete-${c.id}`)}
                              onMouseLeave={() => {
                                setHoveredActionKey(null);
                                setPressedActionKey(null);
                              }}
                              onMouseDown={() => setPressedActionKey(`delete-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              disabled={processingCommentId === c.id}
                              style={getActionButtonStyle('delete', `delete-${c.id}`)}
                            >
                              Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void reportComment(c.id);
                              }}
                              onMouseEnter={() => setHoveredActionKey(`report-${c.id}`)}
                              onMouseLeave={() => {
                                setHoveredActionKey(null);
                                setPressedActionKey(null);
                              }}
                              onMouseDown={() => setPressedActionKey(`report-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              disabled={processingCommentId === c.id}
                              style={getActionButtonStyle('report', `report-${c.id}`)}
                            >
                              Report
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div style={{ filter: showActions && !isEditingThisComment ? 'blur(1px)' : 'none', opacity: showActions && !isEditingThisComment ? 0.45 : 1, transition: 'filter 0.2s, opacity 0.2s' }}>
                    <div style={{
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      marginBottom: 4,
                      fontSize: '15px',
                    }}>
                      {c.user}
                    </div>
                    {editingCommentId === c.id ? (
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 14,
                          marginBottom: 8,
                          resize: 'vertical',
                        }}
                      />
                    ) : (
                      <div style={{
                        color: '#333',
                        lineHeight: 1.5,
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                        marginBottom: 8,
                        fontSize: '14px',
                      }}>
                        {c.text}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleLike(i)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          border: `1px solid ${userVotes[i] === 'like' ? 'var(--color-primary)' : '#ddd'}`,
                          backgroundColor: userVotes[i] === 'like' ? 'var(--color-primary)' : '#fff',
                          color: userVotes[i] === 'like' ? '#fff' : '#333',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        👍 {likes[i] || 0}
                      </button>
                      <button
                        onClick={() => handleDislike(i)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          border: `1px solid ${userVotes[i] === 'dislike' ? 'var(--color-primary)' : '#ddd'}`,
                          backgroundColor: userVotes[i] === 'dislike' ? 'var(--color-primary)' : '#fff',
                          color: userVotes[i] === 'dislike' ? '#fff' : '#333',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        👎 {dislikes[i] || 0}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

