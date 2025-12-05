// frontend/src/components/IdeaList.jsx
import React, { useState, useEffect } from 'react';
import '../styles/ideaList.css';

const IdeaList = ({ currentUser }) => {
  // États pour stocker les données
  const [ideas, setIdeas] = useState([]); // Liste des idées
  const [loading, setLoading] = useState(true); // État de chargement
  const [error, setError] = useState(''); // Messages d'erreur

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
      }

    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression');
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

              {/* Bouton supprimer (seulement pour l'auteur) */}
              {isAuthor && (
                <button 
                  className="idea-delete-btn" 
                  onClick={() => handleDelete(idea._id)}
                  title="Supprimer"
                >
                  🗑️
                </button>
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

            {/* Statistiques */}
            <div className="idea-stats">
              <span>❤️ {idea.likesCount || 0} likes</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IdeaList;