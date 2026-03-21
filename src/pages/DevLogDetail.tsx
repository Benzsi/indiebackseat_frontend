import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Clock, Code2, Image, Send } from 'lucide-react';
import type { User } from '../services/api';

interface DevLogEntry {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

interface DevProject {
  id: number;
  name: string;
  category: string;
  description: string;
  developerId: number;
  developer: { username: string };
  entries: DevLogEntry[];
}

interface DevLogDetailProps {
  user: User | null;
}

export function DevLogDetail({ user }: DevLogDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<DevProject | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Entry form state
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (err) {
      console.error('Hiba a projekt lekérésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`http://localhost:3000/api/devlogs/${id}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: entryTitle, content: entryContent })
      });

      if (response.ok) {
        setEntryTitle('');
        setEntryContent('');
        fetchProject();
      }
    } catch (err) {
      console.error('Hiba a bejegyzés létrehozásakor:', err);
    }
  };

  if (loading) return <div className="loading">Betöltés...</div>;
  if (!project) return <Navigate to="/devlogs" replace />;

  const isOwner = user?.id === project.developerId && user?.role === 'DEVELOPER';

  return (
    <div className="devlogdetail-page">
      <div className="devlogdetail-header">
        <Link to="/devlogs" className="devlogs-back-btn">
          <ArrowLeft size={16} />
          Dev Logs
        </Link>

        <div className="devlogdetail-hero">
          <div className="devlogdetail-hero-grey">
            <Code2 size={48} strokeWidth={1} color="#b0bec5" />
          </div>
          <div className="devlogdetail-hero-overlay">
            <div className="devlogdetail-hero-content">
              <span className="devlog-meta-tag" style={{ marginBottom: '10px' }}>
                {project.category}
              </span>
              <h1 className="devlogdetail-hero-title">{project.name}</h1>
              <p className="devlogdetail-hero-dev">
                ✍️ {project.developer.username} fejlesztői naplója
              </p>
              <p className="devlogdetail-hero-desc">{project.description}</p>
            </div>
          </div>
        </div>
      </div>

      {isOwner && (
        <section className="add-entry-section">
          <h2 className="add-entry-title">Új bejegyzés hozzáadása</h2>
          <form onSubmit={handleCreateEntry}>
            <div className="form-group">
              <label>Bejegyzés címe</label>
              <input 
                type="text" 
                value={entryTitle} 
                onChange={(e) => setEntryTitle(e.target.value)} 
                placeholder="Pl. Új mechanika implementálva"
                required 
              />
            </div>
            <div className="form-group">
              <label>Tartalom</label>
              <textarea 
                value={entryContent} 
                onChange={(e) => setEntryContent(e.target.value)} 
                placeholder="Írd le a haladást..."
                required 
              />
            </div>
            <div className="form-group">
              <label>Bejegyzés képe (opcionális)</label>
              <div className="image-upload-placeholder" style={{ padding: '15px' }}>
                <button type="button" className="upload-btn">Kép hozzáadása</button>
              </div>
            </div>
            <button type="submit" className="submit-btn highlight-btn" style={{ maxWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Send size={16} />
              Közzététel
            </button>
          </form>
        </section>
      )}

      <div className="devlogdetail-posts">
        <h2 className="devlogdetail-posts-title">Bejegyzések</h2>
        <div className="devlogdetail-posts-list">
          {project.entries.length === 0 ? (
            <div className="no-projects">Még nincsenek bejegyzések.</div>
          ) : (
            project.entries.map((entry) => (
              <article key={entry.id} className="devlogpost-card">
                <div className="devlogpost-img-wrap">
                  <div className="devlogpost-img-grey">
                    <Image size={36} strokeWidth={1.2} color="#b0bec5" />
                  </div>
                </div>

                <div className="devlogpost-body">
                  <div className="devlogpost-meta">
                    <span className="devlogpost-tag">
                      <Tag size={12} />
                      Frissítés
                    </span>
                    <span className="devlogpost-date">
                      <Calendar size={12} />
                      {new Date(entry.createdAt).toLocaleDateString('hu-HU')}
                    </span>
                    <span className="devlogpost-read">
                      <Clock size={12} />
                      ~2 perc olvasás
                    </span>
                  </div>
                  <h3 className="devlogpost-title">{entry.title}</h3>
                  <p className="devlogpost-para">{entry.content}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
