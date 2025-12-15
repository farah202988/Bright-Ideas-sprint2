import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/accueil.css';
import bgImage from '../assets/bright-ideas-bg.jpg';

const Statistics = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalIdeas: 0, totalLikes: 0, ideas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/signin');
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.role === 'admin') {
      navigate('/admin');
      return;
    }

    setUser(userData);

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/ideas', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();

        if (!data.success) {
          setError(data.message || 'Erreur lors du chargement des statistiques');
          setLoading(false);
          return;
        }

        const myIdeas = (data.ideas || []).filter(
          (idea) => idea.author?._id === userData._id
        );

        const totalIdeas = myIdeas.length;
        const totalLikes = myIdeas.reduce(
          (sum, i) => sum + (i.likesCount || 0),
          0
        );

        const ideas = myIdeas.map((i) => ({
          id: i._id,
          text: i.text,
          likes: i.likesCount || 0,
          createdAt: i.createdAt,
        }));

        setStats({ totalIdeas, totalLikes, ideas });
        setLoading(false);
      } catch (err) {
        console.error('Erreur stats utilisateur:', err);
        setError("Erreur lors du chargement des statistiques");
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  if (!user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a', color: '#fff' }}><p>Chargement...</p></div>;
  }

  const userInitial = (user.name || user.alias || 'U').charAt(0).toUpperCase();

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="app-root">
      <div className="bg-hero" aria-hidden="true" style={{ backgroundImage: `url(${bgImage})` }} />

      {/* SIDEBAR GAUCHE (Navigation) */}
      <aside className="sidebar" aria-label="Navigation">
        <div className="sidebar-top">
          <div className="sidebar-brand">💡 Bright Ideas</div>

          <div
            className="sidebar-profile-section"
            role="button"
            tabIndex={0}
          >
            {user.profilePhoto ?
              <img src={user.profilePhoto} alt="profile" className="sidebar-avatar" /> :
              <div className="sidebar-avatar-initial">{userInitial}</div>
            }
            <div className="sidebar-username">{user.alias || user.name}</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main menu">
          <a href="/accueil" className="nav-item">Home</a>
          <a href="/my-ideas" className="nav-item">My Ideas</a>
          <a href="/statistics" className="nav-item active">Statistics</a>
        </nav>
      </aside>

      {/* CONTENU PRINCIPAL : Statistiques utilisateur */}
      <div className="main-content-wrapper">
        <section className="hero-section glass-hero hero-improved" role="banner">
          <div className="hero-left hero-left-improved">
            <h1 className="hero-title hero-title-improved">My Statistics</h1>
            <div className="hero-accent" aria-hidden="true" />
            <p className="hero-subtitle hero-subtitle-improved">
              Visualisez combien d'idées vous avez publiées et combien de likes vous avez reçus.
            </p>
          </div>
        </section>

        <main className="main-content">
          <section className="panel card-panel" style={{ marginBottom: '20px' }}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                {error}
              </div>
            )}

            {loading ? (
              <div className="ideas-loading">
                <div className="spinner"></div>
                <p>Chargement des statistiques...</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card card-panel">
                    <div className="stat-icon">💡</div>
                    <div className="stat-content">
                      <h3>Total de vos idées</h3>
                      <p className="stat-number">{stats.totalIdeas}</p>
                    </div>
                  </div>

                  <div className="stat-card card-panel">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-content">
                      <h3>Likes reçus</h3>
                      <p className="stat-number">{stats.totalLikes}</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h2 className="panel-title">Détail par idée</h2>
                  {stats.ideas.length === 0 ? (
                    <p style={{ marginTop: '8px', color: '#9ca3af' }}>
                      Vous n'avez pas encore publié d'idée.
                    </p>
                  ) : (
                    <div className="ideas-table">
                      {stats.ideas.map((idea) => (
                        <div key={idea.id} className="ideas-table-row">
                          <div className="ideas-table-text">
                            {idea.text.length > 80
                              ? `${idea.text.slice(0, 80)}...`
                              : idea.text}
                          </div>
                          <div className="ideas-table-meta">
                            <span className="ideas-table-date">{formatDate(idea.createdAt)}</span>
                            <span className="ideas-table-likes">❤️ {idea.likes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Statistics;


