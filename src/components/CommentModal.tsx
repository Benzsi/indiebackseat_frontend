import React from 'react';
import { X } from 'lucide-react';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comment: string) => void;
  GameTitle: string;
}

export function CommentModal({ isOpen, onClose, onSave, GameTitle }: CommentModalProps) {
  const [comment, setComment] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setComment('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1228]/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-[#473472] border border-[#53629E] rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl md:text-2xl font-black text-[#D6F4ED] tracking-tight">
            Backseat a(z) <span className="text-[#87BAC3] italic">"{GameTitle}"</span> játékhoz
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-[#87BAC3] hover:bg-[#53629E]/40 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#87BAC3] uppercase tracking-[0.2em] mb-3 ml-1">Visszajelzésed</label>
            <textarea
              autoFocus
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Írd le a véleményed, tanácsaidat vagy tapasztalataidat..."
              rows={7}
              className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/40 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#87BAC3] transition-all resize-none shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              className="flex-1 py-4 px-6 rounded-2xl border border-red-400/40 text-red-400 font-extrabold text-sm hover:bg-red-400/10 transition-all duration-200"
              onClick={onClose}
            >
              Mégse
            </button>
            <button 
              className="flex-[2] py-4 px-6 rounded-2xl bg-[#D6F4ED] text-[#473472] font-black text-base hover:bg-[#87BAC3] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#D6F4ED]/10 disabled:opacity-50 disabled:scale-100"
              onClick={() => onSave(comment)} 
              disabled={!comment.trim()}
            >
              Közététel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




