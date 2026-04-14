import { useEffect, useState } from 'react';
import type { Comment } from '../services/api';
import { CommentsService } from '../services/api';

interface CommentsProps {
  GameId: number;
}

export function Comments({ GameId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const commentsService = new CommentsService();

  useEffect(() => {
    loadComments();
  }, [GameId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await commentsService.getGameComments(GameId);
      setComments(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kommentek betöltése sikertelen');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (commentId: number, isLike: boolean | null) => {
    try {
      const updatedComment = await commentsService.voteComment(commentId, isLike);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updatedComment : c))
      );
    } catch (err) {
      console.error('Hiba történt a szavazat mentésekor', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Backseating betöltése...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#e74c3c', textAlign: 'center' }}>{error}</div>;
  }

  if (comments.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Még nincs backseat erre a játékra.</div>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)' }}>
        Kommentek ({comments.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              padding: '12px 16px',
              backgroundColor: '#f8faff',
              borderRadius: 8,
              borderLeft: '4px solid var(--color-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                {comment.user.username}
              </span>
              <span style={{ fontSize: 12, color: '#999' }}>
                {new Date(comment.createdAt).toLocaleDateString('hu-HU')}
              </span>
            </div>
            <p style={{ margin: 0, color: '#333', lineHeight: 1.5, wordWrap: 'break-word', marginBottom: 16 }}>
              {comment.content}
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleVote(comment.id, true); }}
                title="Tetszik"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: comment.userVote === 1 ? 'var(--color-primary)' : '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  opacity: 1, 
                  fontSize: 14,
                  fontWeight: comment.userVote === 1 ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                  textShadow: comment.userVote === 1 ? 'none' : '0px 0px 2px rgba(0,0,0,0.5)'
                }}
              >
                👍 {comment.likes || 0}
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleVote(comment.id, false); }}
                title="Nem tetszik"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: comment.userVote === -1 ? 'var(--color-primary)' : '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  opacity: 1, 
                  fontSize: 14,
                  fontWeight: comment.userVote === -1 ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                  textShadow: comment.userVote === -1 ? 'none' : '0px 0px 2px rgba(0,0,0,0.5)'
                }}
              >
                👎 {comment.dislikes || 0}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




