import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Gamepad2, ChevronRight, Plus, X } from 'lucide-react';
import type { User } from '../services/api';

export interface DevLog {
  id: number;
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  developer: { username: string };
  _count: { entries: number };
}

interface DevLogsProps {
  user: User | null;
}

export function DevLogs({ user }: DevLogsProps) {
  const [projects, setProjects] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/devlogs');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Hiba a projektek lekérésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch('http://localhost:3000/api/devlogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, category, description })
      });

      if (response.ok) {
        setShowModal(false);
        setName('');
        setCategory('');
        setDescription('');
        fetchProjects();
      }
    } catch (err) {
      console.error('Hiba a projekt létrehozásakor:', err);
    }
  };

  const isDeveloper = user?.role === 'DEVELOPER';

  return (
    <div className="devlogs-page">
      <div className="devlogs-header">
        <div className="devlogs-header-left">
          <Link to="/" className="devlogs-back-btn">
            <ArrowLeft size={16} />
            Vissza
          </Link>
          <div className="devlogs-title-wrap">
            <div className="devlogs-icon-box">
              <Code2 size={22} color="#fff" />
            </div>
            <div>
              <h1 className="devlogs-title">Dev Logs</h1>
              <p className="devlogs-subtitle">Fejlesztői naplók &amp; játékbemutatók</p>
            </div>
          </div>
        </div>
        
        {isDeveloper && (
          <button className="create-project-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Projekt létrehozása
          </button>
        )}
      </div>

      {showModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal-content">
            <div className="modal-header">
              <h2>Új projekt létrehozása</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Projekt neve</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Pl. Neon Drift"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Kategória</label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  placeholder="Pl. Racing, RPG"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Rövid leírás</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Miről szól a játékod?"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Borítókép</label>
                <div className="image-upload-placeholder">
                  <button type="button" className="upload-btn">Kép feltöltése</button>
                </div>
              </div>
              <button type="submit" className="submit-btn highlight-btn">Létrehozás</button>
            </form>
          </div>
        </div>
      )}

      <div className="devlogs-grid">
        {loading ? (
          <div>Betöltés...</div>
        ) : projects.length === 0 ? (
          <div className="no-projects">Még nincsenek projektek. Legyél te az első!</div>
        ) : (
          projects.map((log) => (
            <Link to={`/devlogs/${log.id}`} key={log.id} className="devlog-card" style={{ textDecoration: 'none' }}>
              <div className="devlog-card-info">
                <div className="devlog-meta-tag">
                  <Gamepad2 size={13} />
                  {log.category}
                </div>
                <h2 className="devlog-game-name">{log.name}</h2>
                <p className="devlog-developer">
                  <span className="devlog-dev-label">Fejlesztő</span>
                  {log.developer.username}
                </p>
                <p className="devlog-description">{log.description}</p>
                <div className="devlog-card-footer">
                  <span className="devlog-post-count">{log._count.entries} bejegyzés</span>
                  <span className="devlog-read-more">
                    Olvasd el <ChevronRight size={14} />
                  </span>
                </div>
              </div>

              <div className="devlog-card-image">
                <div className="devlog-img-grey">
                  <Gamepad2 size={36} strokeWidth={1.2} color="#b0bec5" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

