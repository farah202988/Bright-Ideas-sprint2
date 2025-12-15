import { User } from "../models/user.model.js";
import { Idea } from "../models/idea.model.js";

// GET ADMIN DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = totalUsers - verifiedUsers;

    // Utilisateurs actifs (connexion dans les 7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo },
    });

    // Statistiques sur les idées et les likes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const totalIdeas = await Idea.countDocuments();
    const ideasThisMonth = await Idea.countDocuments({
      createdAt: { $gte: startOfMonth },
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
        verifiedUsers,
        unverifiedUsers,
        activeUsers,
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

// VERIFY USER EMAIL
export const verifyUserEmail = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true, verificationToken: null, verificationTokenExpiresAt: null },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur vérifié avec succès",
      user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// CHANGE USER ROLE
export const changeUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    const currentUserId = req.user._id;

    // Vérifier que le rôle est valide
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide. Les rôles autorisés sont: user, admin",
      });
    }

    // Empêcher un admin de se retirer ses droits à lui-même
    if (userId === currentUserId.toString() && role === "user") {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas retirer vos propres droits d'administrateur",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: `Rôle de l'utilisateur changé en ${role}`,
      user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET USER ACTIVITY LOG
export const getUserActivityLog = async (req, res) => {
  try {
    const users = await User.find()
      .select("name alias email lastLogin isVerified role createdAt")
      .sort({ lastLogin: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      message: "Logs d'activité récupérés",
      users,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET USERS WITH FILTERS
export const getUsersWithFilters = async (req, res) => {
  try {
    const { role, isVerified, searchTerm, sortBy, page = 1, limit = 10 } = req.query;

    // Construire le filtre
    let filter = {};

    if (role) {
      filter.role = role;
    }

    if (isVerified !== undefined) {
      filter.isVerified = isVerified === "true";
    }

    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { alias: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Déterminer le tri
    let sort = { createdAt: -1 };
    if (sortBy === "lastLogin") {
      sort = { lastLogin: -1 };
    } else if (sortBy === "name") {
      sort = { name: 1 };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(filter)
      .select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limitNum);

    res.status(200).json({
      success: true,
      message: "Utilisateurs récupérés",
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// EXPORT USERS DATA (CSV format)
export const exportUsersData = async (req, res) => {
  try {
    const users = await User.find()
      .select("name alias email role isVerified dateOfBirth address createdAt lastLogin");

    // Formater en CSV
    const csvHeader = "Nom,Alias,Email,Rôle,Vérifié,Date Inscription,Dernière Connexion\n";
    const csvData = users.map(user =>
      `${user.name},${user.alias},${user.email},${user.role},${user.isVerified ? "Oui" : "Non"},${new Date(user.createdAt).toLocaleDateString()},${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Jamais"}`
    ).join("\n");

    const csv = csvHeader + csvData;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users_export.csv");
    res.send(csv);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// BULK DELETE USERS
export const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const currentUserId = req.user._id;

    // Vérifier que l'admin ne se supprime pas lui-même
    if (userIds.includes(currentUserId.toString())) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte",
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Fournissez au moins un ID utilisateur",
      });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} utilisateur(s) supprimé(s)`,
      deletedCount: result.deletedCount,
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