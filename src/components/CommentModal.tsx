import React from 'react';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comment: string) => void;
  bookTitle: string;
}

export function CommentModal({ isOpen, onClose, onSave, bookTitle }: CommentModalProps) {
  const [comment, setComment] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setComment('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 540, minWidth: 340, padding: '38px 32px 28px 32px', borderRadius: 16 }}>
        <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 18, color: 'var(--color-primary)', textAlign: 'center' }}>
          Backseat a(z) "{bookTitle}" jatekhoz
        </h3>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Írd be a backseatet..."
          rows={7}
          style={{ width: '100%', minHeight: 120, fontSize: 18, borderRadius: 10, border: '1.5px solid var(--color-primary)', padding: 16, marginBottom: 18, resize: 'vertical', background: '#f8faff', color: '#222' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn" style={{ fontSize: 16, padding: '10px 22px', color: '#fff', background: '#e74c3c', border: 'none' }} onClick={onClose}>Mégse</button>
          <button className="btn btn-primary" style={{ fontSize: 16, padding: '10px 22px' }} onClick={() => onSave(comment)} disabled={!comment.trim()}>
            Mentés
          </button>
        </div>
      </div>
    </div>
  );
}
