import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookBack } from '../components/BookBack';
import { StarRating } from '../components/StarRating';
import type { User, Book, Comment, SteamAchievementsResponse } from '../services/api';
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
              // Silence errors if steam data fetching fails
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
    <div className="w-full max-w-[1200px] mx-auto px-4 py-6">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#D6F4ED] border border-[#53629E] bg-[#53629E]/30 hover:bg-[#53629E]/60 transition-all"
        >
          ← Vissza a katalógushoz
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#87BAC3] text-sm font-semibold">Játék betöltése...</div>
      ) : error ? (
        <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-sm font-semibold">{error}</div>
      ) : !book ? (
        <div className="flex items-center justify-center py-20 text-[#87BAC3] text-sm">A játék nem található.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* Left column: cover + rating + comment form */}
          <div className="flex flex-col gap-5">
            {/* Cover */}
            <div className="w-full h-[380px] sm:h-[460px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#473472] to-[#53629E] border border-[#53629E] shadow-xl">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement
                      ?.querySelector('.cover-placeholder')
                      ?.classList.remove('hidden-placeholder');
                  }}
                />
              ) : null}
              <div className={`cover-placeholder text-[80px] ${book.coverUrl ? 'hidden-placeholder' : ''}`}>🎮</div>
            </div>

            {/* Rating + Comment form */}
            <div className="bg-[#473472] rounded-2xl border border-[#53629E] shadow-lg p-5 flex flex-col gap-4">
              {/* User rating */}
              <div>
                <div className="text-xs text-[#87BAC3] mb-2 font-semibold uppercase tracking-widest">
                  {pendingRating ? 'Az értékelésed:' : 'Értékeld a játékot:'}
                </div>
                <StarRating rating={pendingRating} onRate={handleRate} size="medium" />
              </div>

              <div className="border-t border-[#53629E]/40" />

              {/* Comment input */}
              <div>
                <div className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest mb-2">Start backseating</div>
                <textarea
                  className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/60 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#87BAC3] transition-all resize-none"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Mit gondolsz erről a játékról?"
                  rows={4}
                />
                <button
                  className="mt-3 w-full py-3 rounded-xl bg-[#D6F4ED] text-[#473472] font-black text-sm hover:bg-[#87BAC3] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={savingComment || !newComment.trim()}
                  onClick={handleCreateComment}
                >
                  {savingComment ? 'Mentés...' : 'Komment mentése'}
                </button>
              </div>
            </div>
          </div>

          {/* Right column: BookBack */}
          <div className="min-h-[500px]">
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
