import { useNavigate } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { StarRating } from './StarRating';
import type { Game } from '../services/api';

export interface GameWithRating extends Game {
  averageRating?: number;
  totalRatings?: number;
}

interface GameCardProps {
  game: GameWithRating;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onOpenAddList: (game: GameWithRating) => void;
  onToggleFavorite?: (game: GameWithRating) => void;
  onToggleWishlist?: (game: GameWithRating) => void;
  isFavorited?: boolean;
  isWishlisted?: boolean;
}

export function GameCard({
  game,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onOpenAddList,
  onToggleFavorite,
  onToggleWishlist,
  isFavorited = false,
  isWishlisted = false
}: GameCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="relative bg-[#473472] border border-[#53629E] rounded-2xl overflow-hidden cursor-pointer flex flex-col shadow-[0_4px_16px_rgba(71,52,114,0.25)] hover:-translate-y-1.5 hover:bg-[#53629E] hover:shadow-[0_12px_28px_rgba(71,52,114,0.4)] transition-all duration-300 min-h-[420px] h-full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => navigate(`/games/${game.id}`)}
    >
      {/* Top accent bar on hover */}
      <div className={`absolute top-0 left-0 w-full h-0.5 rounded-t-2xl bg-gradient-to-r from-[#87BAC3] to-[#D6F4ED] transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

      {/* Header: title + badges */}
      <div className="px-4 pt-4 pb-0 flex flex-col gap-2">
        <div className="overflow-hidden">
          <div
            style={{
              animation: isHovered ? 'scrollHover 6s ease-in-out infinite alternate' : 'none',
              transform: 'translateX(0)',
            }}
          >
            <h3 className="text-[14px] font-extrabold m-0 text-white leading-tight">{game.title}</h3>
            <span className="text-[12px] text-white/70 italic font-semibold">- {game.author}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            {game.literaryForm}
          </span>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
            {game.genre}
          </span>
        </div>
      </div>

      {/* Cover image */}
      <div className="mt-3 mx-4 h-[280px] flex-shrink-0 flex items-center justify-center overflow-hidden relative rounded-xl bg-gradient-to-br from-[#53629E] to-[#473472] shadow-[0_4px_14px_rgba(0,0,0,0.25)] border border-[#D6F4ED]/10">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.querySelector('.cover-placeholder')!.classList.remove('hidden-placeholder');
            }}
          />
        ) : null}
        <div className={`cover-placeholder text-[80px] ${game.coverUrl ? 'hidden-placeholder' : ''}`}>📖</div>
      </div>

      {/* Rating */}
      <div className="px-4 py-3 flex-1 flex flex-col">
        <div className="mb-2">
          <div className="text-[10px] text-white/60 mb-1">Átlagos értékelés:</div>
          <StarRating
            rating={game.averageRating || 0}
            totalRatings={game.totalRatings || 0}
            readonly
            size="small"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-0">
        <button
          className="flex-1 py-2 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-bold hover:bg-white/20 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAddList(game);
          }}
        >
          Listához adás
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(game);
          }}
          title="Kívánságlistához adás"
          className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center hover:scale-110 transition-transform duration-200"
        >
          <Star fill={isWishlisted ? "#3b82f6" : "none"} color="#3b82f6" size={24} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(game);
          }}
          title="Kedvelés"
          className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center hover:scale-110 transition-transform duration-200"
        >
          <Heart fill={isFavorited ? "#ef4444" : "none"} color="#ef4444" size={24} />
        </button>
      </div>
    </div>
  );
}




