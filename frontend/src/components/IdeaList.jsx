// frontend/src/components/IdeaList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import '../styles/ideaList.css';

const IdeaList = ({ currentUser, filterByAuthorId }) => {
  // États pour stocker les données
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États pour la modification
  const [editingIdea, setEditingIdea] = useState(null);
  const [editText, setEditText] = useState('');

  // État pour la fenêtre listant les likes
  const [likesIdea, setLikesIdea] = useState(null);

  // État pour le menu 3 points
  const [openMenuId, setOpenMenuId] = useState(null);

  // État pour la confirmation de suppression
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fonction pour récupérer les idées - AVEC useCallback
  const fetchIdeas = useCallback(async () => {
    try {
      const response = await fetch('/api/ideas', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        let loadedIdeas = data.ideas;

        if (filterByAuthorId) {
          loadedIdeas = loadedIdeas.filter(
            (idea) => idea.author?._id === filterByAuthorId
          );
        }

        // ⭐ TRI PAR NOMBRE DE LIKES DÉCROISSANT
        loadedIdeas.sort((a, b) => {
          const likesA = a.likesCount || 0;
          const likesB = b.likesCount || 0;
          return likesB - likesA; // Du plus grand au plus petit
        });

        setIdeas(loadedIdeas);
      } else {
        setError(data.message || 'Erreur lors du chargement des idées');
      }

      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des idées');
      setLoading(false);
    }
  }, [filterByAuthorId]);

  // useEffect CORRIGÉ - avec fetchIdeas dans les dépendances
  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.idea-menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fonction pour supprimer une idée
  const handleDelete = async (ideaId) => {
    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setIdeas((prev) => prev.filter((idea) => idea._id !== ideaId));
        setSuccess('✓ Idée supprimée avec succès');
        setDeleteConfirm(null);
        setOpenMenuId(null);
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erreur lors de la suppression');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Ouvrir le modal d'édition
  const openEditModal = (idea) => {
    setEditingIdea(idea);
    setEditText(idea.text || '');
    setOpenMenuId(null);
  };

  const closeEditModal = () => {
    setEditingIdea(null);
    setEditText('');
  };

  // Enregistrer la modification
  const handleSaveEdit = async () => {
    if (!editingIdea) return;

    const newText = editText.trim();
    if (newText.length < 10) {
      setError('Le texte doit contenir au moins 10 caractères');
      setTimeout(() => setError(''), 3000);
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
        // Mettre à jour la liste ET re-trier
        setIdeas((prev) => {
          const updated = prev.map((i) => (i._id === editingIdea._id ? data.idea : i));
          // Re-trier après modification
          return updated.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        });
        setSuccess('✓ Idée modifiée avec succès');
        closeEditModal();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erreur lors de la mise à jour');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setError('Erreur lors de la mise à jour');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Fonction pour like / unlike
  const handleToggleLike = async (idea) => {
    if (!currentUser) {
      setError("Vous devez être connecté pour liker une idée");
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${idea._id}/like`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        // Mettre à jour la liste ET re-trier
        setIdeas((prev) => {
          const updated = prev.map((i) => (i._id === idea._id ? data.idea : i));
          // Re-trier après like/unlike
          return updated.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        });
      } else {
        setError(data.message || "Erreur lors du like");
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error("Erreur like:", err);
      setError("Erreur lors du like");
      setTimeout(() => setError(''), 3000);
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

  if (loading) {
    return (
      <div className="ideas-loading">
        <div className="spinner"></div>
        <p>Chargement des idées...</p>
      </div>
    );
  }

  if (error && ideas.length === 0) {
    return (
      <div className="ideas-error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="ideas-empty">
        <p>💡 Aucune idée pour le moment. Soyez le premier à partager !</p>
      </div>
    );
  }

  return (
    <>
      {/* Messages de succès/erreur globaux */}
      {success && (
        <div className="global-alert global-alert-success">
          {success}
        </div>
      )}
      
      {error && (
        <div className="global-alert global-alert-error">
          ⚠️ {error}
        </div>
      )}

      <div className="ideas-container">
        {ideas.map((idea) => {
          const isAuthor = currentUser?._id === idea.author?._id;
          const hasLiked = idea.likedBy?.some((u) => u._id === currentUser?._id);
          const authorName = idea.author?.alias || idea.author?.name || 'Utilisateur';
          const authorPhoto = idea.author?.profilePhoto;
          const authorInitial = authorName.charAt(0).toUpperCase();

          return (
            <div key={idea._id} className="idea-card">
              {/* En-tête avec auteur */}
              <div className="idea-header">
                <div className="idea-author">
                  <div className="idea-avatar">
                    {authorPhoto ? (
                      <img src={authorPhoto} alt={authorName} />
                    ) : (
                      <div className="idea-avatar-initial">{authorInitial}</div>
                    )}
                  </div>
                  
                  <div className="idea-author-info">
                    <span className="idea-author-name">{authorName}</span>
                    <span className="idea-date">{formatDate(idea.createdAt)}</span>
                  </div>
                </div>

                {/* Menu 3 points (seulement pour l'auteur) */}
                {isAuthor && (
                  <div className="idea-menu-container">
                    <button
                      className="idea-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === idea._id ? null : idea._id);
                      }}
                      title="Options"
                    >
                      ⋮
                    </button>

                    {openMenuId === idea._id && (
                      <div className="idea-dropdown-menu">
                        <button
                          className="dropdown-item edit-item"
                          onClick={() => openEditModal(idea)}
                        >
                          <span className="dropdown-icon">✏️</span>
                          Modifier
                        </button>
                        <button
                          className="dropdown-item delete-item"
                          onClick={() => {
                            setDeleteConfirm(idea._id);
                            setOpenMenuId(null);
                          }}
                        >
                          <span className="dropdown-icon">🗑️</span>
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contenu de l'idée */}
              <div className="idea-content">
                <p className="idea-text">{idea.text}</p>
                
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
                  style={{ cursor: idea.likedBy?.length > 0 ? 'pointer' : 'default' }}
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

      {/* Modal confirmation suppression */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onConfirm={() => handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Modal liste des likes */}
      <LikesModal
        idea={likesIdea}
        onClose={() => setLikesIdea(null)}
      />
    </>
  );
};

// Modal pour l'édition d'une idée
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
            <div className="char-count">{text.length} / 2000 caractères</div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={onSave}>
              ✓ Sauvegarder
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

// Modal de confirmation de suppression
const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-container modal-confirm"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '450px' }}
      >
        <div className="modal-header modal-header-danger">
          <h2 className="modal-title">⚠️ Confirmer la suppression</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">
            Êtes-vous sûr de vouloir supprimer cette idée ? 
            <br />
            <strong>Cette action est irréversible.</strong>
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            🗑️ Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal pour afficher la liste des likes
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
            <p className="empty-likes">Aucun like pour le moment.</p>
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