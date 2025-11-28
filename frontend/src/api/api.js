// src/api/api.js

// Configuration de l'URL de base de votre API backend
const API_BASE_URL = 'http://localhost:5000/api/auth';


////////////////PARTIE de SIGNUP
//Déclaration de la fonction signupUser
export const signupUser = async (userData) => {
  try {
    // ENVOI des données au backend
    const response = await fetch(`http://localhost:5000/api/auth/signup`, {
      method: 'POST',                    
      headers: {
        'Content-Type': 'application/json', // ←On indique qu’on envoie du JSON.
      },
      credentials: 'include',      // ← Autorise l’envoi des cookies
      body: JSON.stringify({ //convertit l’objet en texte JSON
        name: userData.name,
        alias: userData.alias,
        email: userData.email,
        dateOfBirth: userData.dateOfBirth,
        address: userData.address,
        password: userData.password,
        confirmPassword: userData.confirmPassword
      }),
    });

    const data = await response.json();//Attends que le serveur envoie le JSON, puis transforme-le en véritable objet JavaScript.

    // ✅ Si réponse n'est pas OK, lancer erreur
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'inscription');
    }

    return data; 
  } catch (error) {
    console.error('❌ Erreur API signup:', error);
    throw error;
  }
};

////////////////partie de signinnn
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important pour les cookies JWT
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      }),
    });

    const data = await response.json();

    // Si la réponse n'est pas OK, lancer une erreur avec le message du serveur
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la connexion');
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur API login:', error);
    throw error;
  }
};

/**
 * Fonction pour la déconnexion d'un utilisateur
 * Supprime le cookie JWT côté serveur
 * @returns {Promise<Object>} Réponse du serveur confirmant la déconnexion
 */
export const logoutUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include', // Important pour envoyer le cookie
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la déconnexion');
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur API logout:', error);
    throw error;
  }
};