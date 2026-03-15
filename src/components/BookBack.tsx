import { useState } from 'react';
import { StarRating } from './StarRating';

//Márk
//uj oldalra kell majd tenni a könyv részleteit, ahol a könyv hátulját 
//jeleníti meg, és ott lesznek a kommentek is, amikhez lehet likeolni/dislikeolni
//hover es a gomb ne forduljon kommentre es listhahoz mindig legyen
//a csillag is legyen az uj oldalon 
//Kommentekhez like/dislike gomb, amik megmutatják a szavazatok számát is

interface BookBackProps {
  title: string;
  author: string;
  averageRating: number;
  totalRatings: number;
  comments: { user: string; text: string; }[];
  description?: string;
  videoUrl?: string;
}

export function BookBack({ title, author, averageRating, totalRatings, comments, description, videoUrl }: BookBackProps) {
  const [likes, setLikes] = useState<Record<number, number>>({});
  const [dislikes, setDislikes] = useState<Record<number, number>>({});
  const [userVotes, setUserVotes] = useState<Record<number, 'like' | 'dislike' | null>>({});

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
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '14px' }}>Kommentek ({comments.length})</div>
        {comments.length === 0 ? (
          <div style={{ color: '#888', fontSize: 13 }}>Még nincs komment.</div>
        ) : (
          <div style={{ 
            overflow: 'auto',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 8,
          }}>
            {comments.map((c, i) => (
              <div key={i} style={{ 
                fontSize: '14px',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                borderLeft: '3px solid var(--color-primary)',
              }}>
                <div style={{ 
                  fontWeight: 700, 
                  color: 'var(--color-primary)',
                  marginBottom: 4,
                  fontSize: '15px',
                }}>
                  {c.user}
                </div>
                <div style={{ 
                  color: '#333',
                  lineHeight: 1.5,
                  wordWrap: 'break-word',
                  marginBottom: 8,
                  fontSize: '14px',
                }}>
                  {c.text}
                </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

