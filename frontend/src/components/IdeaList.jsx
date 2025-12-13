// frontend/src/components/IdeaList.jsx
import React, { useState, useEffect } from 'react';
import '../styles/ideaList.css';

const IdeaList = ({ currentUser }) => {
  // États pour stocker les données
  const [ideas, setIdeas] = useState([]); // Liste des idées
  const [loading, setLoading] = useState(true); // État de chargement
  const [error, setError] = useState(''); // Messages d'erreur
  const [openMenuId, setOpenMenuId] = useState(null); // ID du menu ouvert
  const [editingIdea, setEditingIdea] = useState(null); // Idée en cours d'édition
  const [editText, setEditText] = useState(''); // Texte édité

  // Fonction pour récupérer les idées
  const fetchIdeas = async () => {
    try {
      // 1. Faire la requête au backend
      const response = await fetch('http://localhost:5000/api/ideas', {
        method: 'GET',
        credentials: 'include',
      });

      // 2. Récupérer les données
      const data = await response.json();

      // 3. Vérifier si tout s'est bien passé
      if (data.success) {
        setIdeas(data.ideas); // Mettre à jour les idées
      } else {
        setError('Erreur lors du chargement des idées');
      }

      // 4. Arrêter le chargement
      setLoading(false);

    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des idées');
      setLoading(false);
    }
  };

  // Charger les idées au démarrage du composant
  useEffect(() => {
    fetchIdeas();
  }, []); // [] = une seule fois au démarrage

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Fonction pour supprimer une idée
  const handleDelete = async (ideaId) => {
    // Demander confirmation
    if (!window.confirm('Voulez-vous vraiment supprimer cette idée ?')) {
      return;
    }

    try {
      // 1. Envoyer la requête de suppression
      const response = await fetch(`http://localhost:5000/api/ideas/${ideaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      // 2. Si succès, retirer l'idée de la liste
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
        // Mettre à jour l'idée dans la liste
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

  // Fonction pour annuler l'édition
  const handleCancelEdit = () => {
    setEditingIdea(null);
    setEditText('');
  };

  // Fonction pour basculer le menu
  const toggleMenu = (e, ideaId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === ideaId ? null : ideaId);
  };

  // Fonction pour formater la date
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

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="ideas-loading">
        <div className="spinner"></div>
        <p>Chargement des idées...</p>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="ideas-error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  // Affichage si aucune idée
  if (ideas.length === 0) {
    return (
      <div className="ideas-empty">
        <p>💡 Aucune idée pour le moment. Soyez le premier à partager !</p>
      </div>
    );
  }

  // Affichage de la liste des idées
  return (
    <div className="ideas-container">
      {ideas.map((idea) => {
        // Vérifier si l'utilisateur est l'auteur
        const isAuthor = currentUser?._id === idea.author?._id;
        
        // Nom et photo de l'auteur
        const authorName = idea.author?.alias || idea.author?.name || 'Utilisateur';
        const authorPhoto = idea.author?.profilePhoto;
        const authorInitial = authorName.charAt(0).toUpperCase();

        // Vérifier si cette idée est en cours d'édition
        const isEditing = editingIdea === idea._id;

        return (
          <div key={idea._id} className="idea-card">
            {/* En-tête avec auteur */}
            <div className="idea-header">
              <div className="idea-author">
                {/* Avatar */}
                <div className="idea-avatar">
                  {authorPhoto ? (
                    <img src={authorPhoto} alt={authorName} />
                  ) : (
                    <div className="idea-avatar-initial">{authorInitial}</div>
                  )}
                </div>
                
                {/* Infos auteur */}
                <div className="idea-author-info">
                  <span className="idea-author-name">{authorName}</span>
                  <span className="idea-date">{formatDate(idea.createdAt)}</span>
                </div>
              </div>

              {/* Menu trois points (seulement pour l'auteur) */}
              {isAuthor && (
                <div className="idea-menu-container">
                  <button 
                    className="idea-menu-btn" 
                    onClick={(e) => toggleMenu(e, idea._id)}
                    title="Options"
                  >
                    ⋮
                  </button>
                  
                  {/* Menu déroulant */}
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
              )}
            </div>

            {/* Contenu de l'idée */}
            <div className="idea-content">
              {isEditing ? (
                // Mode édition
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
                // Mode affichage normal
                <>
                  <p className="idea-text">{idea.text}</p>
                  
                  {/* Image si elle existe */}
                  {idea.image && (
                    <div className="idea-image-container">
                      <img src={idea.image} alt="Idea" className="idea-image" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Statistiques */}
            {!isEditing && (
              <div className="idea-stats">
                <span>❤️ {idea.likesCount || 0} likes</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IdeaList;
