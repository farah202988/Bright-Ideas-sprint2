// backend/controllers/idea.controller.js
import { Idea } from "../models/idea.model.js";

// ========== CRÉER UNE IDÉE ==========
export const createIdea = async (req, res) => {
  try {
    // 1. Récupérer les données envoyées
    const { text, image } = req.body;
    const userId = req.user._id; // ID de l'utilisateur connecté

    // 2. Vérifier que le texte existe et fait au moins 10 caractères
    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Le texte doit contenir au moins 10 caractères",
      });
    }

    // 3. Créer la nouvelle idée
    const newIdea = new Idea({
      text: text,
      image: image || null,
      author: userId,
    });

    // 4. Sauvegarder dans la base de données
    await newIdea.save();

    // 5. Remplir les infos de l'auteur (nom, photo, etc.)
    await newIdea.populate("author", "name alias profilePhoto");

    // 6. Renvoyer la réponse
    res.status(201).json({
      success: true,
      message: "Idée publiée avec succès",
      idea: newIdea,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== RÉCUPÉRER TOUTES LES IDÉES ==========
export const getAllIdeas = async (req, res) => {
  try {
    // 1. Chercher toutes les idées dans la base
    const ideas = await Idea.find()
      .populate("author", "name alias profilePhoto") // Ajouter les infos de l'auteur
      .populate("likedBy", "name alias profilePhoto") // Infos sur qui a liké
      .sort({ createdAt: -1 }); // Trier par date (plus récent en premier)

    // 2. Renvoyer les idées
    res.status(200).json({
      success: true,
      ideas: ideas,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== METTRE À JOUR UNE IDÉE (AUTEUR SEULEMENT) ==========
export const updateIdea = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { text, image } = req.body;

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idée non trouvée",
      });
    }

    // Vérifier que l'utilisateur est bien l'auteur
    if (idea.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas modifier cette idée",
      });
    }

    if (text && text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Le texte doit contenir au moins 10 caractères",
      });
    }

    if (text) idea.text = text;
    if (image !== undefined) idea.image = image || null;

    await idea.save();
    await idea.populate("author", "name alias profilePhoto");
    await idea.populate("likedBy", "name alias profilePhoto");

    res.status(200).json({
      success: true,
      message: "Idée mise à jour avec succès",
      idea,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== SUPPRIMER UNE IDÉE (AUTEUR SEULEMENT) ==========
export const deleteIdea = async (req, res) => {
  try {
    // 1. Récupérer l'ID de l'idée à supprimer
    const { id } = req.params;
    const userId = req.user._id;

    // 2. Trouver l'idée
    const idea = await Idea.findById(id);

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idée non trouvée",
      });
    }

    // 3. Vérifier que c'est bien l'auteur qui supprime
    if (idea.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas supprimer cette idée",
      });
    }

    // 4. Supprimer l'idée
    await Idea.findByIdAndDelete(id);

    // 5. Renvoyer la confirmation
    res.status(200).json({
      success: true,
      message: "Idée supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== LIKE / UNLIKE UNE IDÉE ==========
export const toggleLikeIdea = async (req, res) => {
  try {
    // 1. RÉCUPÉRER L'ID DE L'IDÉE ET L'UTILISATEUR
    const { id } = req.params;// ID de l'idée depuis l'URL
    const userId = req.user._id;//ID de l'utilisateur connecté(verifyToken)
    // 2. TROUVER L'IDÉE DANS LA BASE DE DONNÉES(mongodb)
    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idée non trouvée",
      });
    }
    //vérifier si l’ID de l’utilisateur connecté existe déjà dans la liste des likes de lidée.
    const hasLiked = idea.likedBy.some(
      (u) => u.toString() === userId.toString()
    );

    if (hasLiked) {
      // UNLIKE
      idea.likedBy = idea.likedBy.filter(//filter() crée un nouveau tableau
        (u) => u.toString() !== userId.toString()//On garde tous les IDs sauf celui de l’utilisateur connecté
      );
    } else {
      // LIKE
      idea.likedBy.push(userId);//Ajoute l’ID de l’utilisateur à la fin du tableau
    }

    //“Le nombre de likes = le nombre d’utilisateurs qui ont liké”
    idea.likesCount = idea.likedBy.length;

    await idea.save();
    await idea.populate("author", "name alias profilePhoto");
    await idea.populate("likedBy", "name alias profilePhoto");

    res.status(200).json({
      success: true,
      liked: !hasLiked,// true si on vient de liker, false si on a unliké
      likesCount: idea.likesCount,
      idea,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};