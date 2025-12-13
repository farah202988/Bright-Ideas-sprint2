import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/accueil.css';
import '../styles/MyIdeas.css';
import bgImage from '../assets/bright-ideas-bg.jpg';

const MyIdeas = () => {
  const [user, setUser] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingIdea, setEditingIdea] = useState(null);
  const [editText, setEditText] = useState('');
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
    fetchMyIdeas(userData._id);
  }, [navigate]);

  // Récupérer mes idées
  const fetchMyIdeas = async (userId) => {
    try {
      const response = await fetch('http://localhost:5000/api/ideas', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        // Filtrer pour garder uniquement les idées de l'utilisateur connecté
        const myIdeas = data.ideas.filter(idea => idea.author._id === userId);
        setIdeas(myIdeas);
      } else {
        setError('Erreur lors du chargement de vos idées');
      }

      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement de vos idées');
      setLoading(false);
    }
  };

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/signin');
  };

  // Fonction pour supprimer une idée
  const handleDelete = async (ideaId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette idée ?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/ideas/${ideaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setIdeas(ideas.filter(idea => idea._id !== ideaId));
        setOpenMenuId(null);
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression');
    }
  };

  // Fonction pour démarrer l'édition
  const handleStartEdit = (idea) => {
    setEditingIdea(idea._id);
    setEditText(idea.text);
    setOpenMenuId(null);
  };

  // Fonction pour sauvegarder la modification
  const handleSaveEdit = async (ideaId) => {
    if (!editText.trim() || editText.trim().length < 10) {
      alert('Le texte doit contenir au moins 10 caractères');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/ideas/${ideaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: editText }),
      });

      const data = await response.json();

      if (data.success) {
        setIdeas(ideas.map(idea => 
          idea._id === ideaId ? { ...idea, text: editText } : idea
        ));
        setEditingIdea(null);
        setEditText('');
      } else {
        alert(data.message || 'Erreur lors de la modification');
      }
    } catch (err) {
      console.error('Erreur modification:', err);
      alert('Erreur lors de la modification');
    }
  };

  const handleCancelEdit = () => {
    setEditingIdea(null);
    setEditText('');
  };

  const toggleMenu = (e, ideaId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === ideaId ? null : ideaId);
  };

  const formatDate = (date) => {
    const now = new Date();
    const ideaDate = new Date(date);
    const diffMs = now - ideaDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return ideaDate.toLocaleDateString('fr-FR');
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a', color: '#fff' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  const profilePhotoSrc = user.profilePhoto || null;
  const userInitial = (user.name || user.alias || 'U').charAt(0).toUpperCase();

  return (
    <div className="app-root">
      <div className="bg-hero" aria-hidden="true" style={{ backgroundImage: `url(${bgImage})` }} />

      {/* SIDEBAR GAUCHE (Navigation) */}
      <aside className="sidebar" aria-label="Navigation">
        <div className="sidebar-top">
          <div className="sidebar-brand">💡 Bright Ideas</div>
          
          <div className="sidebar-profile-section" onClick={() => navigate('/accueil')}>
            {profilePhotoSrc ? 
              <img src={profilePhotoSrc} alt="profile" className="sidebar-avatar" /> : 
              <div className="sidebar-avatar-initial">{userInitial}</div>
            }
            <div className="sidebar-username">{user.alias || user.name}</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main menu">
          <a href="/accueil" className="nav-item">Home</a>
          <a href="/my-ideas" className="nav-item active">My Ideas</a>
          <a href="/statistics" className="nav-item">Statistics</a>

          <div
            className="nav-item profile-item"
            onClick={(e) => { 
              e.stopPropagation(); 
              setShowDropdown(!showDropdown); 
            }}
            role="button" tabIndex={0}
          >
            Profile
            <span className={`dropdown-arrow-sidebar ${showDropdown ? 'open' : ''}`}>▼</span>
          </div>

          {showDropdown && (
            <div className="dropdown-submenu">
              <button className="dropdown-submenu-item" onClick={() => navigate('/accueil')}>
                Personal Information
              </button>
              <button className="dropdown-submenu-item" onClick={() => navigate('/accueil')}>
                Change Password
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* CONTENEUR PRINCIPAL */}
      <div className="main-content-wrapper">
        <section className="hero-section glass-hero hero-improved">
          <div className="hero-left hero-left-improved">
            <h1 className="hero-title hero-title-improved">Mes Idées 💡</h1>
            <div className="hero-accent" aria-hidden="true" />
            <p className="hero-subtitle hero-subtitle-improved">
              Vous avez partagé {ideas.length} {ideas.length > 1 ? 'idées' : 'idée'}
            </p>
          </div>
        </section>

        <main className="main-content">
          {loading ? (
            <div className="ideas-loading">
              <div className="spinner"></div>
              <p>Chargement de vos idées...</p>
            </div>
          ) : error ? (
            <div className="ideas-error">
              <p>⚠️ {error}</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="ideas-empty">
              <p>💡 Vous n'avez pas encore partagé d'idées.</p>
              <button className="btn-go-home" onClick={() => navigate('/accueil')}>
                Partager une idée
              </button>
            </div>
          ) : (
            <div className="ideas-container">
              {ideas.map((idea) => {
                const isEditing = editingIdea === idea._id;

                return (
                  <div key={idea._id} className="idea-card">
                    <div className="idea-header">
                      <div className="idea-author">
                        <div className="idea-avatar">
                          {profilePhotoSrc ? (
                            <img src={profilePhotoSrc} alt={user.alias || user.name} />
                          ) : (
                            <div className="idea-avatar-initial">{userInitial}</div>
                          )}
                        </div>
                        
                        <div className="idea-author-info">
                          <span className="idea-author-name">{user.alias || user.name}</span>
                          <span className="idea-date">{formatDate(idea.createdAt)}</span>
                        </div>
                      </div>

                      <div className="idea-menu-container">
                        <button 
                          className="idea-menu-btn" 
                          onClick={(e) => toggleMenu(e, idea._id)}
                          title="Options"
                        >
                          ⋮
                        </button>
                        
                        {openMenuId === idea._id && (
                          <div className="idea-dropdown-menu">
                            <button 
                              className="idea-dropdown-item edit"
                              onClick={() => handleStartEdit(idea)}
                            >
                              ✏️ Modifier
                            </button>
                            <button 
                              className="idea-dropdown-item delete"
                              onClick={() => handleDelete(idea._id)}
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="idea-content">
                      {isEditing ? (
                        <div className="idea-edit-container">
                          <textarea
                            className="idea-edit-textarea"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows="4"
                          />
                          <div className="idea-edit-actions">
                            <button 
                              className="idea-edit-save-btn"
                              onClick={() => handleSaveEdit(idea._id)}
                            >
                              ✓ Enregistrer
                            </button>
                            <button 
                              className="idea-edit-cancel-btn"
                              onClick={handleCancelEdit}
                            >
                              ✕ Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="idea-text">{idea.text}</p>
                          
                          {idea.image && (
                            <div className="idea-image-container">
                              <img src={idea.image} alt="Idea" className="idea-image" />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="idea-stats">
                        <span>❤️ {idea.likesCount || 0} likes</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* SIDEBAR DROITE */}
      <aside className="right-sidebar" aria-label="Stats">
        <div className="sidebar-panel">
          <h3 className="sidebar-title">Statistiques</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Total d'idées</span>
              <span className="stat-value">{ideas.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total de likes</span>
              <span className="stat-value">
                {ideas.reduce((total, idea) => total + (idea.likesCount || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MyIdeas;
