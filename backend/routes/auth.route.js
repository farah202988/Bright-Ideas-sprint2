import express from "express";
import { signup, login, logout, updateProfile, changePassword } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js"; // À importer depuis ton middleware

const router = express.Router();

// Routes d'authentification
// La requête POST /signup arrive ici
router.post("/signup", signup); // ← Appelle la fonction signup du contrôleur
// La requête POST /login arrive ici
router.post("/login", login); // Appelle la fonction login du contrôleur
router.post("/logout", logout);   // POST pour se déconnecter

// Routes protégées (authentification requise)
router.put("/update-profile", verifyToken, updateProfile);   // PUT pour mettre à jour le profil
router.put("/change-password", verifyToken, changePassword); // PUT pour changer le mot de passe

export default router;
