import { useNavigate } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { StarRating } from './StarRating';
import type { Book } from '../services/api';

export interface BookWithRating extends Book {
  averageRating?: number;
  totalRatings?: number;
}

interface BookCardProps {
  book: BookWithRating;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onOpenAddList: (book: BookWithRating) => void;
}

export function BookCard({ book, isHovered, onMouseEnter, onMouseLeave, onOpenAddList }: BookCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="book-card"
      style={{ position: 'relative' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => navigate(`/books/${book.id}`)}
    >
      <div className="book-header" style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
            <div className="card-title-container" style={{ overflow: 'hidden' }}>
              <div 
                className="card-title-scroller" 
                style={{ 
                  animation: isHovered ? 'scrollHover 6s ease-in-out infinite alternate' : 'none',
                  transform: 'translateX(0)' 
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#1e293b' }}>{book.title}</h3>
                <span style={{ fontSize: '13px', color: '#64748b', margin: 0, fontStyle: 'italic', fontWeight: 600 }}>- {book.author}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge">{book.literaryForm}</span>
              <span className="badge badge-genre">{book.genre}</span>
            </div>
          </div>
          <div className="book-cover" style={{ marginTop: '8px' }}>
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="cover-image"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.querySelector('.cover-placeholder')!.classList.remove('hidden-placeholder');
                }}
              />
            ) : null}
            <div className={`cover-placeholder ${book.coverUrl ? 'hidden-placeholder' : ''}`}>📖</div>
          </div>
          <div className="book-info">
            {/* Átlagos értékelés megjelenítése */}
            <div className="book-rating-section" style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                Átlagos értékelés:
              </div>
              <StarRating
                rating={book.averageRating || 0}
                totalRatings={book.totalRatings || 0}
                readonly
                size="small"
              />
            </div>
          </div>
      <div className="book-card-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="btn btn-addlist"
          style={{ flex: 1, margin: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenAddList(book);
          }}
        >
          Listához adás
        </button>
        <button onClick={(e) => e.stopPropagation()} title="Kiemelés" style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <Star fill="none" color="#3b82f6" size={24} />
        </button>
        <button onClick={(e) => e.stopPropagation()} title="Kedvelés" style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <Heart fill="none" color="#ef4444" size={24} />
        </button>
      </div>
    </div>
  );
}
