// src/api/api.js

// On utilise une URL relative, le proxy CRA redirige vers http://localhost:5000
//On écrit /api/... et React envoie automatiquement la requête au backend sur le port 5000
const API_BASE_URL = '/api/auth';

// SIGNUP
export const signupUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: userData.name,
        alias: userData.alias,
        email: userData.email,
        dateOfBirth: userData.dateOfBirth,
        address: userData.address,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de l'inscription");
    }

    return data;
  } catch (error) {
    console.error(' Erreur API signup:', error);
    throw error;
  }
};

// LOGIN
//C’est une fonction JavaScript qui crée et envoie une requête HTTP vers l’API backend
//“Cette fonction frontend sert à appeler l’API backend de login et à gérer la réponse afin de connecter l’utilisateur.”
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la connexion');
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur API login:', error);
    throw error;
  }
};

// LOGOUT
export const logoutUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
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