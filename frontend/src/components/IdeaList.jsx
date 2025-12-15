// frontend/src/components/IdeaList.jsx
import React, { useState, useEffect } from 'react';
import '../styles/ideaList.css';

const IdeaList = ({ currentUser, filterByAuthorId }) => {
  // États pour stocker les données
  const [ideas, setIdeas] = useState([]); // Liste des idées
  const [loading, setLoading] = useState(true); // État de chargement
  const [error, setError] = useState(''); // Messages d'erreur

  // États pour la modification via interface
  const [editingIdea, setEditingIdea] = useState(null);
  const [editText, setEditText] = useState('');

  // État pour la fenêtre listant les likes
  const [likesIdea, setLikesIdea] = useState(null);

  // Fonction pour récupérer les idées
  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/ideas', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        let loadedIdeas = data.ideas;

        // Si on demande un filtrage par auteur (page My Ideas)
        if (filterByAuthorId) {
          loadedIdeas = loadedIdeas.filter(
            (idea) => idea.author?._id === filterByAuthorId
          );
        }

        setIdeas(loadedIdeas); // Mettre à jour les idées
      } else {
        setError(data.message || 'Erreur lors du chargement des idées');
      }

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

  // Fonction pour supprimer une idée (auteur)
  const handleDelete = async (ideaId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette idée ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setIdeas((prev) => prev.filter((idea) => idea._id !== ideaId));
      } else {
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression');
    }
  };

  // Ouvrir le modal d'édition
  const openEditModal = (idea) => {
    setEditingIdea(idea);
    setEditText(idea.text || '');
  };

  const closeEditModal = () => {
    setEditingIdea(null);
    setEditText('');
  };

  // Enregistrer la modification (auteur)
  const handleSaveEdit = async () => {
    if (!editingIdea) return;

    const newText = editText.trim();
    if (newText.length < 10) {
      alert('Le texte doit contenir au moins 10 caractères');
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${editingIdea._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: newText }),
      });

      const data = await response.json();
      if (data.success) {
        setIdeas((prev) =>
          prev.map((i) => (i._id === editingIdea._id ? data.idea : i))
        );
        closeEditModal();
      } else {
        alert(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

  // Fonction pour like / unlike
  const handleToggleLike = async (idea) => {
    if (!currentUser) {
      alert("Vous devez être connecté pour liker une idée");
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${idea._id}/like`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setIdeas((prev) =>
          prev.map((i) => (i._id === idea._id ? data.idea : i))
        );
      } else {
        alert(data.message || "Erreur lors du like");
      }
    } catch (err) {
      console.error("Erreur like:", err);
      alert("Erreur lors du like");
    }
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

  // Affichage de la liste des idées + modals
  return (
    <>
      <div className="ideas-container">
        {ideas.map((idea) => {
        // Vérifier si l'utilisateur est l'auteur
        const isAuthor = currentUser?._id === idea.author?._id;

        // Vérifier si l'utilisateur a liké
        const hasLiked = idea.likedBy?.some((u) => u._id === currentUser?._id);
        
        // Nom et photo de l'auteur
        const authorName = idea.author?.alias || idea.author?.name || 'Utilisateur';
        const authorPhoto = idea.author?.profilePhoto;
        const authorInitial = authorName.charAt(0).toUpperCase();

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

              {/* Boutons éditer / supprimer (seulement pour l'auteur) */}
              {isAuthor && (
                <div className="idea-actions">
                  <button
                    className="idea-edit-btn"
                    onClick={() => openEditModal(idea)}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    className="idea-delete-btn"
                    onClick={() => handleDelete(idea._id)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>

            {/* Contenu de l'idée */}
            <div className="idea-content">
              <p className="idea-text">{idea.text}</p>
              
              {/* Image si elle existe */}
              {idea.image && (
                <div className="idea-image-container">
                  <img src={idea.image} alt="Idea" className="idea-image" />
                </div>
              )}
            </div>

            {/* Statistiques & like */}
            <div className="idea-stats">
              <button
                className={`idea-like-btn ${hasLiked ? 'liked' : ''}`}
                onClick={() => handleToggleLike(idea)}
                title={hasLiked ? 'Retirer le like' : 'Liker cette idée'}
              >
                {hasLiked ? '❤️' : '🤍'}
              </button>
              <span
                className="idea-likes-count"
                onClick={() => {
                  if (idea.likedBy && idea.likedBy.length > 0) {
                    setLikesIdea(idea);
                  }
                }}
              >
                {idea.likesCount || 0} likes
              </span>
            </div>
          </div>
        );
        })}
      </div>

      {/* Modal édition idée */}
      <EditIdeaModal
        isOpen={!!editingIdea}
        text={editText}
        onChangeText={setEditText}
        onCancel={closeEditModal}
        onSave={handleSaveEdit}
      />

      {/* Modal liste des likes */}
      <LikesModal
        idea={likesIdea}
        onClose={() => setLikesIdea(null)}
      />
    </>
  );
};

// Modal simple pour l'édition d'une idée
const EditIdeaModal = ({ isOpen, text, onChangeText, onCancel, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Modifier votre idée</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Texte de l'idée</label>
            <textarea
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              rows={5}
              className="form-input"
              placeholder="Améliorez votre idée ici..."
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={onSave}>
              Sauvegarder
            </button>
            <button className="btn btn-secondary" onClick={onCancel}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal pour afficher la liste des likes d'une idée
const LikesModal = ({ idea, onClose }) => {
  if (!idea) return null;

  const likedBy = idea.likedBy || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Personnes qui aiment cette idée</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {likedBy.length === 0 ? (
            <p>Aucun like pour le moment.</p>
          ) : (
            <ul className="likes-list">
              {likedBy.map((user) => {
                const name = user.alias || user.name || 'Utilisateur';
                const initial = name.charAt(0).toUpperCase();

                return (
                  <li key={user._id} className="likes-list-item">
                    <div className="likes-avatar">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={name} />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <span className="likes-name">{name}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdeaList;