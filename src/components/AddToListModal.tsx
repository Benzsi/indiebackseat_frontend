import React from 'react';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (listId: number) => void;
  lists: { id: number; name: string }[];
  bookTitle: string;
  onCreateList?: (name: string) => Promise<void>;
}

export function AddToListModal({ isOpen, onClose, onAdd, lists, bookTitle, onCreateList }: AddToListModalProps) {
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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 440, minWidth: 320, padding: '32px 28px 22px 28px', borderRadius: 16 }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)', textAlign: 'center' }}>
          "{bookTitle}" listához adása
        </h3>
        {!showNewList ? (
          <>
            <select
              value={selectedList}
              onChange={e => setSelectedList(e.target.value ? Number(e.target.value) : '')}
              style={{ width: '100%', fontSize: 17, padding: 10, borderRadius: 8, border: '1.5px solid var(--color-primary)', marginBottom: 18, background: '#f8faff', color: '#222' }}
            >
              <option value="">Válassz listát...</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 18 }} onClick={() => setShowNewList(true)}>
              + Új lista létrehozása
            </button>
          </>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <input
              type="text"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder="Lista neve..."
              style={{ width: '100%', fontSize: 17, padding: 10, borderRadius: 8, border: '1.5px solid var(--color-primary)', marginBottom: 10, background: '#f8faff', color: '#222' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{ color: '#fff', background: '#e74c3c', border: 'none' }} onClick={() => setShowNewList(false)} disabled={isCreating}>Mégse</button>
              <button className="btn btn-primary" disabled={!newListName.trim() || isCreating} onClick={async () => {
                if (onCreateList && newListName.trim()) {
                  setIsCreating(true);
                  try {
                    await onCreateList(newListName.trim());
                    setShowNewList(false);
                  } finally {
                    setIsCreating(false);
                  }
                }
              }}>
                {isCreating ? 'Létrehozás...' : 'Létrehozás'}
              </button>
            </div>
          </div>
        )}
        {!showNewList && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn" style={{ fontSize: 16, padding: '10px 22px', color: '#fff', background: '#e74c3c', border: 'none' }} onClick={onClose}>Mégse</button>
            <button className="btn btn-primary" style={{ fontSize: 16, padding: '10px 22px' }} onClick={() => onAdd(selectedList as number)} disabled={selectedList === ''}>
              Hozzáadás
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
