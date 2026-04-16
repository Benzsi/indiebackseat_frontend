import { useState } from 'react';
import { StarRating } from './StarRating';
import { BiLike, BiDislike, BiCog } from "react-icons/bi";
import { Showcase } from './MediaShowcase';

interface GameBackProps {
  title: string;
  author: string;
  averageRating: number;
  totalRatings: number;
  comments: { id: number; user: string; text: string; isOwn?: boolean; likes?: number; dislikes?: number; userVote?: number; }[];
  onEditComment?: (commentId: number, content: string) => Promise<void>;
  onDeleteComment?: (commentId: number) => Promise<void>;
  onReportComment?: (commentId: number) => Promise<void>;
  onVoteComment?: (commentId: number, isLike: boolean | null) => Promise<void>;
  description?: string;
}

export function GameBack({
  title,
  author,
  averageRating,
  totalRatings,
  comments,
  onEditComment,
  onDeleteComment,
  onReportComment,
  onVoteComment,
  description,
}: GameBackProps) {
  const [userVotes, setUserVotes] = useState<Record<number, 'like' | 'dislike' | null>>(() => {
    const initial: Record<number, 'like' | 'dislike' | null> = {};
    comments.forEach(c => {
      if (c.userVote === 1) initial[c.id] = 'like';
      else if (c.userVote === -1) initial[c.id] = 'dislike';
    });
    return initial;
  });
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [processingCommentId, setProcessingCommentId] = useState<number | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [hoveredActionKey, setHoveredActionKey] = useState<string | null>(null);
  const [pressedActionKey, setPressedActionKey] = useState<string | null>(null);

  const handleLike = async (commentId: number) => {
    const newVote = userVotes[commentId] === 'like' ? null : 'like';
    setUserVotes({ ...userVotes, [commentId]: newVote });
    if (onVoteComment) await onVoteComment(commentId, newVote === 'like' ? true : null);
  };

  const handleDislike = async (commentId: number) => {
    const newVote = userVotes[commentId] === 'dislike' ? null : 'dislike';
    setUserVotes({ ...userVotes, [commentId]: newVote });
    if (onVoteComment) await onVoteComment(commentId, newVote === 'dislike' ? false : null);
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
    if (!window.confirm('Biztosan torolni szeretned ezt a backseatet?')) return;
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

  const actionBtn = (type: 'edit' | 'delete' | 'save' | 'cancel' | 'report', key: string, extra?: string) => {
    const base = 'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 cursor-pointer';
    const hovered = hoveredActionKey === key;
    const pressed = pressedActionKey === key;
    const variants = {
      edit: `border-[#87BAC3] text-[#87BAC3] ${hovered || pressed ? 'bg-[#87BAC3]/20' : 'bg-transparent'}`,
      delete: `border-red-400 text-red-400 ${hovered || pressed ? 'bg-red-400/20' : 'bg-transparent'}`,
      save: `border-emerald-400 text-emerald-400 ${hovered || pressed ? 'bg-emerald-400/20' : 'bg-transparent'}`,
      cancel: `border-[#53629E] text-[#87BAC3] ${hovered || pressed ? 'bg-[#53629E]/30' : 'bg-transparent'}`,
      report: `border-amber-400 text-amber-400 ${hovered || pressed ? 'bg-amber-400/20' : 'bg-transparent'}`,
    };
    return `${base} ${variants[type]} ${pressed ? 'scale-[0.97]' : 'scale-100'} ${extra ?? ''}`;
  };

  return (
    <div className="relative h-full flex flex-col bg-[#473472] rounded-2xl border border-[#53629E] p-6 shadow-xl overflow-hidden">
      {/* Title & author */}
      <h3 className="text-xl font-black text-[#D6F4ED] mb-1 tracking-tight">{title}</h3>
      <div className="text-sm italic text-[#87BAC3] mb-4">{author}</div>

      {/* Average rating */}
      <div className="mb-4 pb-4 border-b border-[#53629E]/40">
        <div className="text-xs text-[#87BAC3] mb-1">Átlagos értékelés:</div>
        <StarRating rating={averageRating} totalRatings={totalRatings} readonly size="medium" />
      </div>

      <div>
        <Showcase gameTitle={title} />
      </div>

      {/* Description */}
      <div className="mb-4 p-4 rounded-xl bg-[#53629E]/20 border border-[#53629E]/40">
        <div className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest mb-2">Leírás</div>
        <div className="text-[#D6F4ED]/80 text-sm leading-relaxed">
          {description?.trim() || 'Ide kerülhet a játék rövid leírása.'}
        </div>
      </div>

      {/* Comments */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest mb-3">
          Backseating ({comments.length})
        </div>
        {comments.length === 0 ? (
          <div className="text-[#87BAC3]/60 text-sm">Még nincs backseating.</div>
        ) : (
          <div className="overflow-auto flex-1 min-h-0 flex flex-col gap-3 pr-1">
            {comments.map((c) => {
              const showActions = c.isOwn && (activeCommentId === c.id || editingCommentId === c.id);
              const isEditingThisComment = editingCommentId === c.id;

              return (
                <div
                  key={c.id}
                  className="relative bg-[#53629E]/20 border-l-2 border-[#87BAC3] rounded-xl p-3 min-h-[100px] flex-shrink-0 overflow-hidden"
                >
                  {/* Gear button */}
                  {c.isOwn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveCommentId(prev => prev === c.id ? null : c.id); }}
                      className="absolute top-2 right-2 z-[4] p-1 bg-transparent border-none cursor-pointer text-[#87BAC3] hover:text-[#D6F4ED] transition-colors"
                    >
                      <BiCog size={18} />
                    </button>
                  )}

                  {/* Action overlay */}
                  {showActions && (
                    <div className={`absolute z-[3] ${isEditingThisComment ? 'right-2 bottom-2' : 'inset-0 flex items-center justify-center'}`}
                      style={{ pointerEvents: 'none' }}>
                      <div className="flex gap-2" style={{ pointerEvents: 'auto' }}>
                        {isEditingThisComment ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); void saveEdit(); }}
                              onMouseEnter={() => setHoveredActionKey(`save-${c.id}`)}
                              onMouseLeave={() => { setHoveredActionKey(null); setPressedActionKey(null); }}
                              onMouseDown={() => setPressedActionKey(`save-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              disabled={processingCommentId === c.id || !editingText.trim()}
                              className={actionBtn('save', `save-${c.id}`)}
                            >Save</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingCommentId(null); setEditingText(''); }}
                              onMouseEnter={() => setHoveredActionKey(`cancel-${c.id}`)}
                              onMouseLeave={() => { setHoveredActionKey(null); setPressedActionKey(null); }}
                              onMouseDown={() => setPressedActionKey(`cancel-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              className={actionBtn('cancel', `cancel-${c.id}`)}
                            >Cancel</button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(c.id, c.text); }}
                              onMouseEnter={() => setHoveredActionKey(`edit-${c.id}`)}
                              onMouseLeave={() => { setHoveredActionKey(null); setPressedActionKey(null); }}
                              onMouseDown={() => setPressedActionKey(`edit-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              className={actionBtn('edit', `edit-${c.id}`)}
                            >Edit</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); void deleteComment(c.id); }}
                              onMouseEnter={() => setHoveredActionKey(`delete-${c.id}`)}
                              onMouseLeave={() => { setHoveredActionKey(null); setPressedActionKey(null); }}
                              onMouseDown={() => setPressedActionKey(`delete-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              disabled={processingCommentId === c.id}
                              className={actionBtn('delete', `delete-${c.id}`)}
                            >Delete</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); void reportComment(c.id); }}
                              onMouseEnter={() => setHoveredActionKey(`report-${c.id}`)}
                              onMouseLeave={() => { setHoveredActionKey(null); setPressedActionKey(null); }}
                              onMouseDown={() => setPressedActionKey(`report-${c.id}`)}
                              onMouseUp={() => setPressedActionKey(null)}
                              disabled={processingCommentId === c.id}
                              className={actionBtn('report', `report-${c.id}`)}
                            >Report</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comment body */}
                  <div style={{ filter: showActions && !isEditingThisComment ? 'blur(1px)' : 'none', opacity: showActions && !isEditingThisComment ? 0.45 : 1, transition: 'filter 0.2s, opacity 0.2s' }}>
                    <div className="font-bold text-[#D6F4ED] text-sm mb-1">{c.user}</div>
                    {editingCommentId === c.id ? (
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] rounded-lg px-3 py-2 text-sm mb-2 resize-vertical outline-none focus:border-[#87BAC3]"
                      />
                    ) : (
                      <div className="text-[#D6F4ED]/80 text-sm leading-relaxed break-words whitespace-pre-wrap mb-2">{c.text}</div>
                    )}

                    {/* Like / Dislike */}
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => void handleLike(c.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold border transition-all duration-200 ${userVotes[c.id] === 'like'
                            ? 'bg-[#473472] border-[#D6F4ED] text-[#D6F4ED]'
                            : 'bg-transparent border-[#53629E] text-[#87BAC3] hover:border-[#87BAC3]'
                          }`}
                      >
                        <BiLike size={24} /> <span>{c.likes || 0}</span>
                      </button>
                      <button
                        onClick={() => void handleDislike(c.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold border transition-all duration-200 ${userVotes[c.id] === 'dislike'
                            ? 'bg-[#473472] border-red-400 text-red-400'
                            : 'bg-transparent border-[#53629E] text-[#87BAC3] hover:border-red-400'
                          }`}
                      >
                        <BiDislike size={24} /> <span>{c.dislikes || 0}</span>
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
