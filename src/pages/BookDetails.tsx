import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookBack } from '../components/BookBack';
import { StarRating } from '../components/StarRating';
import type { User, Book, Comment, SteamAchievement, SteamAchievementsResponse } from '../services/api';
import { BooksService, RatingsService, CommentsService, SteamService } from '../services/api';

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
  const [steamData, setSteamData] = useState<SteamAchievementsResponse | null>(null);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const booksService = new BooksService();
  const ratingsService = new RatingsService();
  const commentsService = new CommentsService();
  const steamService = new SteamService();

  useEffect(() => {
    const loadBookDetails = async () => {
      if (!bookId) {
        setError('Hiányzó könyv/játék azonosító');
        setLoading(false);
        return;
      }

      const parsedBookId = Number(bookId);
      if (Number.isNaN(parsedBookId)) {
        setError('Érvénytelen könyv/játék azonosító');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Párhuzamosan betöltjük az alapadatokat
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
        setPendingRating(ownRating);
        setComments(commentsData);
        setError('');

        // Külön töltjük a Steam adatokat, hogy ne akassza meg a fő adatokat, ha nincs a játékosnak
        if (user) {
          steamService.getGameAchievements(parsedBookId)
            .then(data => {
              if (data.achievements && data.achievements.length > 0) {
                setSteamData(data);
              }
            })
            .catch(() => {
              // Ha besül a steam (nincs a fiókján ez a játék vagy nincs auth-olva, süketül elnyeljük)
            });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Játék részleteinek lekérése sikertelen');
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
      setPendingRating(rating);
      const freshRating = await ratingsService.getBookRating(book.id);
      setBook((prev) => prev ? {
        ...prev,
        averageRating: freshRating.averageRating || 0,
        totalRatings: freshRating.totalRatings || 0,
      } : prev);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba az értékelés során');
    }
  };

  const handleCreateComment = async () => {
    if (!user || !book) return;
    if (!newComment.trim()) {
      setError('Adj meg kommentet.');
      return;
    }

    try {
      setSavingComment(true);
      const created = await commentsService.createComment(book.id, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backseat mentése sikertelen');
    } finally {
      setSavingComment(false);
    }
  };

  const handleEditComment = async (commentId: number, content: string) => {
    try {
      const updated = await commentsService.updateComment(commentId, content);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backseat szerkesztése sikertelen');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    try {
      await commentsService.deleteComment(commentId, user.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backseat törlése sikertelen');
    }
  };

  const handleVoteComment = async (commentId: number, isLike: boolean | null) => {
    try {
      const updated = await commentsService.voteComment(commentId, isLike);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backseat értékelése sikertelen');
    }
  };

  const handleReportComment = async (_commentId: number) => {
    alert('Backseat jelentve. Köszönjük a visszajelzést.');
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
        <div className="loading">Játék betöltése...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !book ? (
        <div className="no-books">A játék nem található.</div>
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
              <div className={`cover-placeholder ${book.coverUrl ? 'hidden-placeholder' : ''}`}>🎮</div>
            </div>

            <div className="book-details-feedback-box" style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '13px', color: '#667085', marginBottom: '6px' }}>
                {pendingRating ? 'Az értékelésed:' : 'Értékeld a játékot:'}
              </div>
              <StarRating
                rating={pendingRating}
                onRate={handleRate}
                size="medium"
              />
              <div className="book-details-feedback-divider" />
              <div className="book-details-comment-title">Start backseating</div>
              <textarea
                className="book-details-comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Mit gondolsz erről a játékról?"
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
                id: c.id,
                user: c.user.username,
                text: c.content,
                isOwn: user?.id === c.user.id,
                likes: c.likes,
                dislikes: c.dislikes,
                userVote: c.userVote,
              }))}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onReportComment={handleReportComment}
              onVoteComment={handleVoteComment}
              description={book.lyricNote}
            />
          </div>
        </div>
      )}
    </div>
  );
}
