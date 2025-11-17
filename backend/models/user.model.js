import mongoose from "mongoose";//Elle importe le module Mongoose dans ton fichier.

const userSchema = new mongoose.Schema(
  //mongoose.Schema:un modèle qui décrit à quoi ressemble un utilisateur dans ta base de données.
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    alias: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    profilePhoto: {
      type: String,
      default: null,//pas obligatoire
      // Stocke la photo en base64 ou URL
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'  // Par défaut, tout le monde est utilisateur normal
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date
  },
  { timestamps: true }
);



export const User = mongoose.model("User", userSchema);
//Cette ligne crée la collection “users” dans MongoDB et te donne un objet User pour ajouter, chercher ou modifier des utilisateurs.