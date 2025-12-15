// backend/models/idea.model.js
import mongoose from "mongoose";

// Créer le schéma (structure) d'une idée
const ideaSchema = new mongoose.Schema(
  {
    // Texte de l'idée (obligatoire)
    text: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000
    },
    
    // Image de l'idée (optionnelle)
    image: {
      type: String,
      default: null
    },
    
    // Qui a posté l'idée (référence vers User)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Utilisateurs qui ont liké cette idée
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Nombre de likes (dérivé de likedBy mais stocké pour performance)
    likesCount: {
      type: Number,
      default: 0,
    },

    // Nombre de commentaires
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Exporter le modèle
export const Idea = mongoose.model("Idea", ideaSchema);