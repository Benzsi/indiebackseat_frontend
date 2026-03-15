import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookBack } from '../components/BookBack';
import { StarRating } from '../components/StarRating';
import type { User, Book, Comment } from '../services/api';
import { BooksService, RatingsService, CommentsService } from '../services/api';

interface BookDetailsProps {
  user?: User | null;
}

interface BookWithRating extends Book {
  averageRating: number;
  totalRatings: number;
}

export function BookDetails({ user }: BookDetailsProps) {
  const { bookId } = useParams();
  const [book, setBook] = useState<BookWithRating | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const booksService = new BooksService();
  const ratingsService = new RatingsService();
  const commentsService = new CommentsService();

  useEffect(() => {
    const loadBookDetails = async () => {
      if (!bookId) {
        setError('Hiányzó könyv azonosító');
        setLoading(false);
        return;
      }

      const parsedBookId = Number(bookId);
      if (Number.isNaN(parsedBookId)) {
        setError('Érvénytelen könyv azonosító');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [bookData, ratingData, commentsData, userRatings] = await Promise.all([
          booksService.getBook(parsedBookId),
          ratingsService.getBookRating(parsedBookId),
          commentsService.getBookComments(parsedBookId),
          user ? ratingsService.getUserRatings(user.id) : Promise.resolve([]),
        ]);

        setBook({
          ...bookData,
          averageRating: ratingData.averageRating || 0,
          totalRatings: ratingData.totalRatings || 0,
        });
        const ownRating = userRatings.find((rating) => rating.bookId === parsedBookId)?.rating || 0;
        setUserRating(ownRating);
        setComments(commentsData);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Könyv részleteinek lekérése sikertelen');
      } finally {
        setLoading(false);
      }
    };

    void loadBookDetails();
  }, [bookId, user]);

  const handleRate = async (rating: number) => {
    if (!user || !book) return;
    try {
      await ratingsService.rateBook(user.id, book.id, rating);
      setUserRating(rating);
      const freshRating = await ratingsService.getBookRating(book.id);
      setBook({
        ...book,
        averageRating: freshRating.averageRating || 0,
        totalRatings: freshRating.totalRatings || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba az értékelés során');
    }
  };

  const handleCreateComment = async () => {
    if (!user || !book || !newComment.trim()) return;
    try {
      setSavingComment(true);
      const created = await commentsService.createComment(book.id, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Komment mentése sikertelen');
    } finally {
      setSavingComment(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="book-details-page">
      <div className="book-details-header">
        <Link to="/" className="btn btn-primary">Vissza a katalógushoz</Link>
      </div>

      {loading ? (
        <div className="loading">Könyv betöltése...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !book ? (
        <div className="no-books">A könyv nem található.</div>
      ) : (
        <div className="book-details-card">
          <div className="book-details-cover-wrap">
            <div className="book-cover book-details-cover">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="cover-image"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement
                      ?.querySelector('.cover-placeholder')
                      ?.classList.remove('hidden-placeholder');
                  }}
                />
              ) : null}
              <div className={`cover-placeholder ${book.coverUrl ? 'hidden-placeholder' : ''}`}>📖</div>
            </div>
            <div className="book-details-user-rating">
              <div style={{ fontSize: '13px', color: '#667085', marginBottom: '6px' }}>
                {userRating ? 'Az értékelésed:' : 'Értékeld te is:'}
              </div>
              <StarRating
                rating={userRating}
                onRate={handleRate}
                size="medium"
              />
            </div>
            <div className="book-details-comment-box">
              <div className="book-details-comment-title">Irj kommentet</div>
              <textarea
                className="book-details-comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Mit gondolsz errol a konyvrol?"
                rows={4}
              />
              <button
                className="btn btn-primary"
                disabled={savingComment || !newComment.trim()}
                onClick={handleCreateComment}
              >
                {savingComment ? 'Mentés...' : 'Komment mentése'}
              </button>
            </div>
          </div>

          <div className="book-details-main">
            <BookBack
              title={book.title}
              author={book.author}
              averageRating={book.averageRating}
              totalRatings={book.totalRatings}
              comments={comments.map((c) => ({
                user: c.user.username,
                text: c.content,
              }))}
              description={book.lyricNote}
            />
          </div>
        </div>
      )}
    </div>
  );
}
