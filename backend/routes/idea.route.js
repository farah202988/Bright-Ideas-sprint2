// backend/routes/idea.route.js
import express from "express";
import {
  createIdea,
  getAllIdeas,
  deleteIdea,
  updateIdea,
  toggleLikeIdea,
} from "../controllers/idea.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Route pour récupérer toutes les idées (accessible à tous)
router.get("/", getAllIdeas);

// Route pour créer une idée (il faut être connecté)
router.post("/", verifyToken, createIdea);

// Route pour mettre à jour une idée (il faut être l'auteur)
router.put("/:id", verifyToken, updateIdea);

// Route pour supprimer une idée (il faut être l'auteur)
router.delete("/:id", verifyToken, deleteIdea);

// Route pour liker / unliker une idée
router.post("/:id/like", verifyToken, toggleLikeIdea);

export default router;