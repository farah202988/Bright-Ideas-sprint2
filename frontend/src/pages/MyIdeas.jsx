import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IdeaList from '../components/IdeaList';
import '../styles/accueil.css';
import bgImage from '../assets/bright-ideas-bg.jpg';

const MyIdeas = () => {
  const [user, setUser] = useState(null);
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
  }, [navigate]);

  if (!user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a', color: '#fff' }}><p>Chargement...</p></div>;
  }

  const userInitial = (user.name || user.alias || 'U').charAt(0).toUpperCase();

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
          <a href="/my-ideas" className="nav-item active">My Ideas</a>
          <a href="/statistics" className="nav-item">Statistics</a>
        </nav>
      </aside>

      {/* CONTENU PRINCIPAL : uniquement les idées de l'utilisateur */}
      <div className="main-content-wrapper">
        <section className="hero-section glass-hero hero-improved" role="banner" aria-label="Page header">
          <div className="hero-left hero-left-improved">
            <h1 className="hero-title hero-title-improved">My Ideas</h1>
            <div className="hero-accent" aria-hidden="true" />
            <p className="hero-subtitle hero-subtitle-improved">
              Manage and improve your own ideas. You can edit or delete them here.
            </p>
          </div>
        </section>

        <main className="main-content">
          <section className="panel card-panel">
            <IdeaList
              currentUser={user}
              filterByAuthorId={user._id}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default MyIdeas;


