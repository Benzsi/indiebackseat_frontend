import React from 'react';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (listId: number) => void;
  lists: { id: number; name: string }[];
  GameTitle: string;
  onCreateList?: (name: string) => Promise<void>;
}

export function AddToListModal({ isOpen, onClose, onAdd, lists, GameTitle, onCreateList }: AddToListModalProps) {
  const [selectedList, setSelectedList] = React.useState<number | ''>('');
  const [newListName, setNewListName] = React.useState('');
  const [showNewList, setShowNewList] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedList('');
      setNewListName('');
      setShowNewList(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1228]/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#473472] border border-[#53629E] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
        
        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#87BAC3]/20 to-transparent rounded-tr-3xl pointer-events-none" />

        <h3 className="text-xl md:text-2xl font-black text-[#D6F4ED] text-center mb-8 leading-tight tracking-tight">
          "{GameTitle}"<br /><span className="text-[#87BAC3]">listához adása</span>
        </h3>

        {!showNewList ? (
          <div className="space-y-6">
            <div className="relative">
              <select
                value={selectedList}
                onChange={e => setSelectedList(e.target.value ? Number(e.target.value) : '')}
                className="w-full appearance-none bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] rounded-2xl px-5 py-4 text-lg outline-none focus:border-[#87BAC3] focus:ring-2 focus:ring-[#87BAC3]/20 transition-all cursor-pointer"
              >
                <option value="" className="bg-[#473472]">Válassz listát...</option>
                {lists.map(list => (
                  <option key={list.id} value={list.id} className="bg-[#473472]">{list.name}</option>
                ))}
              </select>
              {/* Custom arrow for select */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#87BAC3]">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <button 
              className="w-full py-4 rounded-2xl bg-[#53629E]/20 border border-dashed border-[#87BAC3]/40 text-[#87BAC3] font-bold text-sm hover:bg-[#53629E]/40 hover:border-[#87BAC3] transition-all duration-300 flex items-center justify-center gap-2 group"
              onClick={() => setShowNewList(true)}
            >
              <span className="text-xl group-hover:scale-125 transition-transform">+</span> Új lista létrehozása
            </button>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                className="flex-1 py-4 px-6 rounded-2xl border border-red-400/40 text-red-400 font-bold text-sm hover:bg-red-400/10 transition-all duration-200"
                onClick={onClose}
              >
                Mégse
              </button>
              <button 
                className="flex-[2] py-4 px-6 rounded-2xl bg-[#D6F4ED] text-[#473472] font-black text-sm hover:bg-[#87BAC3] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#D6F4ED]/10 disabled:opacity-50 disabled:scale-100"
                onClick={() => onAdd(selectedList as number)} 
                disabled={selectedList === ''}
              >
                Hozzáadás
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#87BAC3] uppercase tracking-widest mb-2 ml-1">Lista neve</label>
              <input
                type="text"
                autoFocus
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                placeholder="Pl. Kedvenc indie játékaim"
                className="w-full bg-[#53629E]/30 border border-[#53629E] text-[#D6F4ED] placeholder-[#87BAC3]/40 rounded-2xl px-5 py-4 text-lg outline-none focus:border-[#87BAC3] transition-all"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                className="flex-1 py-4 px-6 rounded-2xl border border-[#53629E] text-[#87BAC3] font-bold text-sm hover:bg-[#53629E]/30 transition-all duration-200"
                onClick={() => setShowNewList(false)} 
                disabled={isCreating}
              >
                Vissza
              </button>
              <button 
                className="flex-[2] py-4 px-6 rounded-2xl bg-[#87BAC3] text-[#473472] font-black text-sm hover:bg-[#D6F4ED] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#87BAC3]/10 disabled:opacity-50 disabled:scale-100"
                disabled={!newListName.trim() || isCreating} 
                onClick={async () => {
                  if (onCreateList && newListName.trim()) {
                    setIsCreating(true);
                    try {
                      await onCreateList(newListName.trim());
                      setShowNewList(false);
                      // After creation, we don't automatically select it here because the component 
                      // expects lists to be updated from outside props.
                    } catch (err) {
                      console.error("Error creating list:", err);
                    } finally {
                      setIsCreating(false);
                    }
                  }
                }}
              >
                {isCreating ? 'Létrehozás...' : 'Lista létrehozása'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




