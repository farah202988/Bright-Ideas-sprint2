import { User } from "../models/user.model.js";
import { Idea } from "../models/idea.model.js";

// GET ADMIN DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();// Nombre total d'utilisateurs
    const adminCount = await User.countDocuments({ role: "admin" });


    


    // Statistiques sur les idées et les likes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);//Change le jour pour mettre le 1er du mois
    startOfMonth.setHours(0, 0, 0, 0);//Met à zéro les heures, minutes, secondes et millisecondes date devient par exemple 1er juin 2024 00:00:00.000

    const totalIdeas = await Idea.countDocuments();
    const ideasThisMonth = await Idea.countDocuments({
      createdAt: { $gte: startOfMonth },//$gte = greater than or equal (supérieur ou égal)
    });

    const ideas = await Idea.find().select("likesCount createdAt");
    const totalLikes = ideas.reduce((sum, i) => sum + (i.likesCount || 0), 0);
    const likesThisMonth = ideas
      .filter((i) => i.createdAt >= startOfMonth)
      .reduce((sum, i) => sum + (i.likesCount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        adminCount,
        totalIdeas,
        ideasThisMonth,
        totalLikes,
        likesThisMonth,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};







// ====== GESTION DES IDÉES PAR L'ADMIN ======

// Récupérer toutes les idées avec auteur et likes
export const getAllIdeasAdmin = async (req, res) => {
  try {
    const ideas = await Idea.find()
      .populate("author", "name alias email profilePhoto")
      .populate("likedBy", "name alias email profilePhoto")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      ideas,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};



// Supprimer une idée (admin)
export const deleteIdeaAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idée non trouvée",
      });
    }

    await Idea.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Idée supprimée par l'administrateur",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};