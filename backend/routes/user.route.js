import express from "express";
import {
  getAllUsers,
  getUserById,
  getUserStats,
  updateUserById,
  deleteUserById,
  searchUsers,
  getUserProfile,
  getUsersByRole,
  getVerifiedUsers,
  getUnverifiedUsers,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// ====== Routes publiques (sans authentification) ======

// Récupérer les statistiques globales des utilisateurs
router.get("/stats", getUserStats);

// ====== Routes protégées (authentification requise) ======

// Récupérer tous les utilisateurs
router.get("/", verifyToken, getAllUsers);

// Récupérer le profil de l'utilisateur connecté
router.get("/profile", verifyToken, getUserProfile);

// Rechercher des utilisateurs avec filtres
router.get("/search", verifyToken, searchUsers);

// Récupérer les utilisateurs vérifiés
router.get("/verified", verifyToken, getVerifiedUsers);

// Récupérer les utilisateurs non vérifiés
router.get("/unverified", verifyToken, getUnverifiedUsers);

// Récupérer les utilisateurs par rôle (user ou admin)
router.get("/role/:role", verifyToken, getUsersByRole);

// Récupérer un utilisateur spécifique par ID
router.get("/:id", verifyToken, getUserById);

// Mettre à jour un utilisateur par ID
router.put("/:id", verifyToken, updateUserById);

// Supprimer un utilisateur par ID
router.delete("/:id", verifyToken, deleteUserById);

export default router;