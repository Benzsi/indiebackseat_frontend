import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { GameBack } from '../components/GameBack';
import { StarRating } from '../components/StarRating';
import type { User, Game, Comment } from '../services/api';
import { GamesService, RatingsService, CommentsService } from '../services/api';
import { RefreshCw } from 'lucide-react';

interface GameDetailsProps {
  user?: User | null;
}

interface GameWithRating extends Game {
  averageRating: number;
  totalRatings: number;
}

export function GameDetails({ user }: GameDetailsProps) {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameWithRating | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const gamesService = new GamesService();
  const ratingsService = new RatingsService();
  const commentsService = new CommentsService();

  useEffect(() => {
    const loadGameDetails = async () => {
      if (!gameId) {
        setError('Hiányzó játék/játék azonosító');
        setLoading(false);
        return;
      }

      const parsedGameId = Number(gameId);
      if (Number.isNaN(parsedGameId)) {
        setError('Érvénytelen játék/játék azonosító');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Párhuzamosan betöltjük az alapadatokat
        const [gameData, ratingData, commentsData, userRatings] = await Promise.all([
          gamesService.getGame(parsedGameId),
          ratingsService.getGameRating(parsedGameId),
          commentsService.getGameComments(parsedGameId),
          user ? ratingsService.getUserRatings(user.id) : Promise.resolve([]),
        ]);

        setGame({
          ...gameData,
          averageRating: ratingData.averageRating || 0,
          totalRatings: ratingData.totalRatings || 0,
        });

        const ownRating = userRatings.find((rating) => rating.gameId === parsedGameId)?.rating || 0;
        setPendingRating(ownRating);
        setComments(commentsData);
        setError('');

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Játék részleteinek lekérése sikertelen');
      } finally {
        setLoading(false);
      }
    };

    void loadGameDetails();
  }, [gameId, user]);

  const handleRate = async (rating: number) => {
    if (!user || !game) return;
    try {
      await ratingsService.rateGame(user.id, game.id, rating);
      setPendingRating(rating);
      const freshRating = await ratingsService.getGameRating(game.id);
      setGame((prev) => prev ? {
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
    if (!user || !game) return;
    if (!newComment.trim()) {
      setError('Adj meg kommentet.');
      return;
    }

    try {
      setSavingComment(true);
      const created = await commentsService.createComment(game.id, newComment.trim());
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
      ) : !game ? (
        <div className="py-32 text-center text-[#87BAC3] font-black uppercase tracking-widest opacity-40">A keresett játék nem található.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10">

          {/* Left column: cover + rating + comment form */}
          <div className="flex flex-col gap-8">
            {/* Cover */}
            <div className="w-full aspect-[3/4] flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-[#1a1228] border border-[#53629E]/40 shadow-2xl relative group">
              {game.coverUrl ? (
                <img
                  src={game.coverUrl}
                  alt={game.title}
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
              <div className={`cover-placeholder text-[80px] ${game.coverUrl ? 'hidden-placeholder' : ''}`}>🎮</div>
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

          {/* Right column: GameBack */}
          <div className="min-h-[600px] bg-[#473472] rounded-[2.5rem] border border-[#53629E] shadow-2xl overflow-hidden">
            <GameBack
              title={game.title}
              author={game.author}
              averageRating={game.averageRating}
              totalRatings={game.totalRatings}
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
              description={game.lyricNote}
            />
          </div>
        </div>
      )}
    </div>
  );
}




