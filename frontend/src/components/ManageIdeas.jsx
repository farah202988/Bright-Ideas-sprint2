import React, { useState, useEffect } from 'react';
import '../styles/manageIdeas.css';

const ManageIdeas = () => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/admin/ideas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors du chargement des idées');
      }

      setIdeas(data.ideas || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des idées');
      setLoading(false);
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:5000/api/admin/ideas/${ideaId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

      setSuccess('✓ Idée supprimée avec succès !');
      setConfirmDeleteId(null);

      setTimeout(() => {
        fetchIdeas();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  // Filtrer les idées
  const filteredIdeas = ideas.filter(idea =>
    idea.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.author?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.author?.alias?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="manage-ideas-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des idées...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-ideas-container">
      {/* Messages */}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      <div className="manage-ideas-header">
        <div className="header-content">
          <h2>💡 Modération des Idées</h2>
          <div className="ideas-count">
            <span className="count-number">{filteredIdeas.length}</span>
            <span className="count-text">Idée{filteredIdeas.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Rechercher par texte, auteur ou alias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredIdeas.length === 0 ? (
        <div className="empty-state">
          <p>Aucune idée trouvée</p>
        </div>
      ) : (
        <div className="ideas-list">
          {filteredIdeas.map((idea) => (
            <div key={idea._id} className="idea-card-admin">
              {/* Header avec auteur */}
              <div className="idea-card-header">
                <div className="author-info">
                  {/* Avatar auteur */}
                  <div className="author-avatar">
                    {idea.author?.profilePhoto ? (
                      <img src={idea.author.profilePhoto} alt={idea.author?.name} />
                    ) : (
                      <div className="avatar-initial">
                        {(idea.author?.name || idea.author?.alias || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Infos auteur */}
                  <div className="author-details">
                    <div className="author-name">
                      {idea.author?.name || 'Utilisateur supprimé'}
                    </div>
                    <div className="author-alias">
                      @{idea.author?.alias || 'N/A'}
                    </div>
                    <div className="idea-date">
                      {new Date(idea.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                {/* Stats - SANS "J'aime" */}
                <div className="idea-stats-admin">
                  <span className="stat-badge">
                    ❤️ {idea.likesCount || 0} likes
                  </span>
                </div>
              </div>

              {/* Contenu - TEXTE VISIBLE */}
              <div className="idea-card-content">
                <p className="idea-text-admin">{idea.text}</p>

                {/* Image si elle existe */}
                {idea.image && (
                  <div className="idea-image-container">
                    <img src={idea.image} alt="Idea" className="idea-image" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="idea-card-footer">
                <button
                  className="btn-delete-idea"
                  onClick={() => setConfirmDeleteId(idea._id)}
                  title="Supprimer cette idée"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div 
            className="modal-content modal-confirm" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>⚠️ Confirmer la suppression</h3>
            </div>

            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer cette idée ? Cette action est irréversible.</p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteId(null)}
              >
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteIdea(confirmDeleteId)}
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageIdeas;