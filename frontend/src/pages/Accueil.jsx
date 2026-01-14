import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostIdea from '../components/PostIdea';
import IdeaList from '../components/IdeaList'; // 
import '../styles/accueil.css';
import bgImage from '../assets/bright-ideas-bg.jpg';

const Acceuil = () => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);//Ça sert à afficher ou cacher un menu déroulant (dropdown).
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info');//Ça sert à savoir quel onglet est actuellement actif (affiché) dans l’interface.
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 // États pour l'édition des informations personnelles
  const [editData, setEditData] = useState({
    name: '',
    alias: '',
    email: '',
    dateOfBirth: '',
    address: '',
    profilePhoto: null,
  });
  // État pour le formulaire de mot de passe
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showOld: false,
    showNew: false,
    showConfirm: false,
  });
  
    // ✅ Au montage du composant, récupérer les données utilisateur
  useEffect(() => {
     // 1. Récupérer les données de localStorage
    const storedUser = localStorage.getItem('user');
    // 2. Vérifier que les données existent
    if (!storedUser) {
      // Si pas de user, rediriger vers signin
      navigate('/signin');
      return;
    }
    
    // 3. Convertir le JSON en objet JavaScript
    const userData = JSON.parse(storedUser);


    if (userData.role === 'admin') {
      navigate('/admin');
      return;
    }
    // 4. Stocker dans le state du composant
    setUser(userData);
    // userData contient: {
    //   _id, name, alias, email, profilePhoto, role, isVerified, ...
    // }
   

    //  Initialiser les données d'édition (editData) avec les données utilisateur actuelles
    setEditData({
      name: userData.name || '',
      alias: userData.alias || '',
      email: userData.email || '',
      dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
      address: userData.address || '',
      profilePhoto: userData.profilePhoto || null,
    });
  }, [navigate]);////
  //Ce useEffect s’exécute uniquement lorsque la page d’accueil s’affiche, afin de vérifier l’utilisateur et effectuer la navigation (navigate) si nécessaire.
      //"2001-05-20T00:00:00.000Z"
      //userData.dateOfBirth.split('T'):Découpe la chaîne là où il y a la lettre T
      //["2001-05-20",0:00:00.000Z"]
      //.split('T')[0]:Prend le premier élément du tableau
      //Résultat final: "2001-05-20"
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/signin');
  };
 
  // Gestion des changements dans le formulaire d'informations personnelles
  const handleInfoChange = (e) => {
    setEditData({ ...editData, [e.target.id]: e.target.value });
  };
  // Gestion du changement de la photo de profil
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];//récupère le fichier sélectionné
    if (file) {
      const reader = new FileReader();//créer un objet FileReader pour lire le fichier
      reader.onloadend = () => {//quand la lecture est terminée
        setEditData({ ...editData, profilePhoto: reader.result });//Met à jour l'état avec la donnée lue (data URL)
      };
      reader.readAsDataURL(file);//lit le fichier en tant que data URL
    }
  };
  // Gestion des changements dans le formulaire de changement de mot de passe
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.id]: e.target.value });
  };

 // Sauvegarder les informations personnelles mises à jour
  const handleSaveInfo = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const bodyData = {
        name: editData.name,
        alias: editData.alias,
        email: editData.email,
        dateOfBirth: editData.dateOfBirth,
        address: editData.address,
      };
      // Ajouter la photo de profil seulement si elle a été modifiée
      if (editData.profilePhoto && editData.profilePhoto.startsWith('data:')) {//si c'est une NOUVELLE image encodée en base64 elle commence par 'data:'(data:image/png;base64,...)
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
      // Mettre à jour les données dans localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Informations mises à jour avec succès !');
      setLoading(false);
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour");
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');
    if (!passwordData.oldPassword) { setError('Veuillez saisir votre ancien mot de passe'); return; }
    if (!passwordData.newPassword) { setError('Veuillez saisir votre nouveau mot de passe'); return; }
    if (passwordData.newPassword.length < 8) { setError('Le nouveau mot de passe doit contenir au moins 8 caractères'); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
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
    
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '', showOld: false, showNew: false, showConfirm: false });// Réinitialiser le formulaire
      setLoading(false);
    } catch (err) {
      setError(err.message || "Erreur lors du changement de mot de passe");
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a', color: '#fff' }}><p>Chargement...</p></div>;
  }

  const profilePhotoSrc = editData.profilePhoto || user.profilePhoto || null;
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
            onClick={() => { setShowProfileModal(true); setActiveTab('info'); }}
            role="button" tabIndex={0} aria-label="Edit profile"
          >
            {profilePhotoSrc ? 
              <img src={profilePhotoSrc} alt="profile" className="sidebar-avatar" /> : 
              <div className="sidebar-avatar-initial">{userInitial}</div>
            }
            <div className="sidebar-username">{user.alias || user.name}</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main menu">
          <a href="/accueil" className="nav-item active">Home</a>
          <a href="/my-ideas" className="nav-item">My Ideas</a>
          <a href="/statistics" className="nav-item">Statistics</a>

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

      {/* CONTENEUR PRINCIPAL (Contenu central) */}
      <div className="main-content-wrapper">
        <section className="hero-section glass-hero hero-improved" role="banner" aria-label="Page header">
          <div className="hero-left hero-left-improved">
            <h1 className="hero-title hero-title-improved">Share Your Ideas. Inspire the World.</h1>
            <div className="hero-accent" aria-hidden="true" />
            <p className="hero-subtitle hero-subtitle-improved">Post your ideas, discover others, and connect with creative minds.</p>
          </div>
        </section>

      <main className="main-content">
        {/* ⭐ NOUVELLE SECTION : Poster une idée */}
        <PostIdea user={user} />

        {/* ⭐ FIL D'IDÉES (connexion avec le backend) */}
        <section className="panel card-panel">
          {/* Ici on affiche les idées venant du backend */}
          <IdeaList currentUser={user} />
        </section>
      </main>

      </div>

      {/* SIDEBAR DROITE (Contenu futur) */}
      <aside className="right-sidebar" aria-label="Future Content">
        <div className="sidebar-panel">
          <h3 className="sidebar-title">Tendances</h3>
          <p className="sidebar-text">Les idées les plus populaires de la semaine</p>
          <div className="future-content-placeholder">
            <p>💡 Innovation Tech</p>
            <p>🌍 Environnement</p>
            <p>🎨 Design & Art</p>
          </div>
        </div>
      </aside>

      {/* MODAL (inchangée) */}
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
                  onClick={() => { setActiveTab('info'); setError(''); setSuccess(''); }}
                >
                  <span className="icon">👤</span> Personal Information
                </button>
                <button 
                  className={`profile-nav-item ${activeTab === 'password' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
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
                        <input id="name" type="text" value={editData.name} onChange={handleInfoChange} className="form-input" placeholder="Enter your full name" />
                      </div>

                      <div className="form-group">
                        <label htmlFor="alias" className="form-label">✨ Username (Alias)</label>
                        <input id="alias" type="text" value={editData.alias} onChange={handleInfoChange} className="form-input" placeholder="Your unique username" />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">📧 Email Address</label>
                        <input id="email" type="email" value={editData.email} onChange={handleInfoChange} className="form-input" placeholder="Your email address" />
                      </div>

                      <div className="form-group">
                        <label htmlFor="dateOfBirth" className="form-label">🎂 Date of Birth</label>
                        <input 
                          id="dateOfBirth" 
                          type="date" 
                          value={editData.dateOfBirth} 
                          onChange={handleInfoChange} 
                          className="form-input"
                          min="1965-01-01"
                          max="2010-12-31"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="address" className="form-label">🏠 Address</label>
                      <textarea id="address" value={editData.address} onChange={handleInfoChange} rows="3" className="form-input" placeholder="Enter your full address" />
                    </div>
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}
                    <div className="form-actions">
                      <button onClick={handleSaveInfo} disabled={loading} className="btn btn-primary">{loading ? '⏳ Saving...' : '✓ Save Changes'}</button>
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
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}
                    <div className="form-actions">
                      <button onClick={handleChangePassword} disabled={loading} className="btn btn-primary">{loading ? '⏳ Updating...' : '✓ Update Password'}</button>
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

export default Acceuil;