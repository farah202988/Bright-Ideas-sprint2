import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/accueil.css';
import bgImage from '../assets/bright-ideas-bg.jpg';

const Statistics = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalIdeas: 0, totalLikes: 0, ideas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [profileError, setProfileError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();

  const [editData, setEditData] = useState({
    name: '',
    alias: '',
    email: '',
    dateOfBirth: '',
    address: '',
    profilePhoto: null,
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showOld: false,
    showNew: false,
    showConfirm: false,
  });

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
    setEditData({
      name: userData.name || '',
      alias: userData.alias || '',
      email: userData.email || '',
      dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
      address: userData.address || '',
      profilePhoto: userData.profilePhoto || null,
    });

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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const handleInfoChange = (e) => {
    setEditData({ ...editData, [e.target.id]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.id]: e.target.value });
  };

  const handleSaveInfo = async () => {
    setProfileError('');
    setSuccess('');
    setProfileLoading(true);
    try {
      const bodyData = {
        name: editData.name,
        alias: editData.alias,
        email: editData.email,
        dateOfBirth: editData.dateOfBirth,
        address: editData.address,
      };
      if (editData.profilePhoto && editData.profilePhoto.startsWith('data:')) {
        bodyData.profilePhoto = editData.profilePhoto;
      }
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Erreur lors de la mise à jour");
      const updatedUser = { ...data.user, profilePhoto: editData.profilePhoto || data.user.profilePhoto };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Informations mises à jour avec succès !');
      setProfileLoading(false);
    } catch (err) {
      setProfileError(err.message || "Erreur lors de la mise à jour");
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setProfileError('');
    setSuccess('');
    if (!passwordData.oldPassword) { setProfileError('Veuillez saisir votre ancien mot de passe'); return; }
    if (!passwordData.newPassword) { setProfileError('Veuillez saisir votre nouveau mot de passe'); return; }
    if (passwordData.newPassword.length < 8) { setProfileError('Le nouveau mot de passe doit contenir au moins 8 caractères'); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { setProfileError('Les mots de passe ne correspondent pas'); return; }

    setProfileLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Erreur lors du changement de mot de passe");
      setSuccess('Mot de passe changé avec succès !');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '', showOld: false, showNew: false, showConfirm: false });
      setProfileLoading(false);
    } catch (err) {
      setProfileError(err.message || "Erreur lors du changement de mot de passe");
      setProfileLoading(false);
    }
  };

  if (!user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a', color: '#fff' }}><p>Chargement...</p></div>;
  }

  const profilePhotoSrc = editData.profilePhoto || user.profilePhoto || null;
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
            onClick={() => { setShowProfileModal(true); setActiveTab('info'); }}
            role="button"
            tabIndex={0}
          >
            {profilePhotoSrc ?
              <img src={profilePhotoSrc} alt="profile" className="sidebar-avatar" /> :
              <div className="sidebar-avatar-initial">{userInitial}</div>
            }
            <div className="sidebar-username">{user.alias || user.name}</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main menu">
          <a href="/accueil" className="nav-item">Home</a>
          <a href="/my-ideas" className="nav-item">My Ideas</a>
          <a href="/statistics" className="nav-item active">Statistics</a>

          <div
            className="nav-item profile-item"
            onClick={(e) => { 
              e.stopPropagation(); 
              setShowDropdown(!showDropdown); 
            }}
            role="button" tabIndex={0}
            aria-expanded={showDropdown}
            aria-controls="profile-submenu"
          >
            Profile
            <span className={`dropdown-arrow-sidebar ${showDropdown ? 'open' : ''}`}>▼</span>
          </div>

          {showDropdown && (
            <div className="dropdown-submenu" id="profile-submenu">
              <button className="dropdown-submenu-item" onClick={() => { 
                setShowProfileModal(true); 
                setActiveTab('info'); 
                setShowDropdown(false);
              }}>Personal Information</button>
              <button className="dropdown-submenu-item" onClick={() => { 
                setShowProfileModal(true); 
                setActiveTab('password'); 
                setShowDropdown(false);
              }}>Change Password</button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
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

      {/* MODAL PROFIL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-container modal-profile-improved" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Profile Settings</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <div className="modal-body modal-body-improved">
              <div className="profile-nav-sidebar">
                <button 
                  className={`profile-nav-item ${activeTab === 'info' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('info'); setProfileError(''); setSuccess(''); }}
                >
                  <span className="icon">👤</span> Personal Information
                </button>
                <button 
                  className={`profile-nav-item ${activeTab === 'password' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('password'); setProfileError(''); setSuccess(''); }}
                >
                  <span className="icon">🔒</span> Change Password
                </button>
              </div>

              <div className="profile-content-area">
                {activeTab === 'info' && (
                  <div className="tab-content-info">
                    <h3 className="content-title">Update Your Personal Details</h3>
                    <p className="content-subtitle">Review and update your profile information. This will be visible to other users.</p>

                    <div className="profile-photo-section">
                      <div className="profile-photo-preview">
                        {editData.profilePhoto ? <img src={editData.profilePhoto} alt="Preview" /> : userInitial}
                      </div>
                      <div className="photo-upload-wrapper">
                        <label htmlFor="photo-upload" className="photo-upload-label">
                          📷 Choose Photo
                        </label>
                        <input 
                          id="photo-upload"
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoChange} 
                          className="photo-upload-input" 
                        />
                        <span className="photo-upload-hint">JPG, PNG or GIF (Max 5MB)</span>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">👤 Full Name</label>
                        <input id="name" type="text" value={editData.name} onChange={handleInfoChange} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="alias" className="form-label">✨ Username</label>
                        <input id="alias" type="text" value={editData.alias} onChange={handleInfoChange} className="form-input" />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">📧 Email</label>
                        <input id="email" type="email" value={editData.email} onChange={handleInfoChange} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="dateOfBirth" className="form-label">🎂 Date of Birth</label>
                        <input id="dateOfBirth" type="date" value={editData.dateOfBirth} onChange={handleInfoChange} className="form-input" min="1965-01-01" max="2010-12-31" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="address" className="form-label">🏠 Address</label>
                      <textarea id="address" value={editData.address} onChange={handleInfoChange} rows="3" className="form-input" />
                    </div>

                    {profileError && <div className="alert alert-error">{profileError}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <div className="form-actions">
                      <button onClick={handleSaveInfo} disabled={profileLoading} className="btn btn-primary">{profileLoading ? '⏳ Saving...' : '✓ Save Changes'}</button>
                      <button onClick={() => setShowProfileModal(false)} className="btn btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}

                {activeTab === 'password' && (
                  <div className="tab-content-password">
                    <h3 className="content-title">Change Your Password</h3>
                    <p className="content-subtitle">Use a strong password that you haven't used before.</p>

                    <div className="form-group">
                      <label htmlFor="oldPassword" className="form-label">Current Password</label>
                      <div className="password-input-wrapper">
                        <input id="oldPassword" type={passwordData.showOld ? 'text' : 'password'} value={passwordData.oldPassword} onChange={handlePasswordChange} className="form-input" />
                        <button type="button" onClick={() => setPasswordData({ ...passwordData, showOld: !passwordData.showOld })} className="toggle-password">{passwordData.showOld ? '👁️' : '👁️‍🗨️'}</button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <div className="password-input-wrapper">
                        <input id="newPassword" type={passwordData.showNew ? 'text' : 'password'} value={passwordData.newPassword} onChange={handlePasswordChange} className="form-input" />
                        <button type="button" onClick={() => setPasswordData({ ...passwordData, showNew: !passwordData.showNew })} className="toggle-password">{passwordData.showNew ? '👁️' : '👁️‍🗨️'}</button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                      <div className="password-input-wrapper">
                        <input id="confirmPassword" type={passwordData.showConfirm ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={handlePasswordChange} className="form-input" />
                        <button type="button" onClick={() => setPasswordData({ ...passwordData, showConfirm: !passwordData.showConfirm })} className="toggle-password">{passwordData.showConfirm ? '👁️' : '👁️‍🗨️'}</button>
                      </div>
                    </div>

                    {profileError && <div className="alert alert-error">{profileError}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <div className="form-actions">
                      <button onClick={handleChangePassword} disabled={profileLoading} className="btn btn-primary">{profileLoading ? '⏳ Updating...' : '✓ Update Password'}</button>
                      <button onClick={() => setShowProfileModal(false)} className="btn btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;