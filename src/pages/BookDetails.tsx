import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookBack } from '../components/BookBack';
import { StarRating } from '../components/StarRating';
import type { User, Book, Comment } from '../services/api';
import { BooksService, RatingsService, CommentsService } from '../services/api';
import { RefreshCw } from 'lucide-react';

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
  const [pendingRating, setPendingRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const booksService = new BooksService();
  const ratingsService = new RatingsService();
  const commentsService = new CommentsService();

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
    <div className="page-container max-w-[1200px] py-12">
      {/* Back button */}
      <div className="mb-10">
        <Link to="/" className="secondary-btn-pill">
          ← Vissza a katalógushoz
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-[#87BAC3]">
          <RefreshCw size={48} className="animate-spin mb-6 opacity-20" />
          <div className="font-black uppercase tracking-[0.3em] text-xs">Játék betöltése...</div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-center">
          {error}
        </div>
      ) : !book ? (
        <div className="py-32 text-center text-[#87BAC3] font-black uppercase tracking-widest opacity-40">A keresett játék nem található.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10">

          {/* Left column: cover + rating + comment form */}
          <div className="flex flex-col gap-8">
            {/* Cover */}
            <div className="w-full aspect-[3/4] flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-[#1a1228] border border-[#53629E]/40 shadow-2xl relative group">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#473472]/60 to-transparent pointer-events-none" />
            </div>

            {/* Rating + Comment form */}
            <div className="bg-[#473472] rounded-[2.5rem] border border-[#53629E] shadow-2xl p-8 flex flex-col gap-6">
              {/* User rating */}
              <div className="space-y-4">
                <div className="glass-label !mb-0 text-center">
                  {pendingRating ? 'Az értékelésed' : 'Értékeld a játékot'}
                </div>
                <div className="flex justify-center bg-white/5 py-4 rounded-2xl border border-white/5">
                  <StarRating rating={pendingRating} onRate={handleRate} size="medium" />
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#53629E]/40 to-transparent" />

              {/* Comment input */}
              <div className="space-y-4">
                <div className="glass-label !mb-0">Start backseating</div>
                <textarea
                  className="glass-input !py-4 !px-5 resize-none min-h-[140px]"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Mit gondolsz erről a játékról?"
                />
                <button
                  className="primary-btn-pill w-full !py-4"
                  disabled={savingComment || !newComment.trim()}
                  onClick={handleCreateComment}
                >
                  {savingComment ? 'Backseat mentése...' : 'Backseat rögzítése'}
                </button>
              </div>
            </div>
          </div>

          {/* Right column: BookBack */}
          <div className="min-h-[600px] bg-[#473472] rounded-[2.5rem] border border-[#53629E] shadow-2xl overflow-hidden">
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
