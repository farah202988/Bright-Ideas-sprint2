import { User } from "../models/user.model.js";

// GET ALL USERS (EXCLURE LES ADMINS)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    res.status(200).json({
      success: true,
      message: "Utilisateurs récupérés avec succès",
      users: users,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET SINGLE USER BY ID
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Empêcher d'accéder aux infos d'un admin
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur récupéré",
      user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET USER STATS
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = totalUsers - verifiedUsers;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        adminCount,
        verifiedUsers,
        unverifiedUsers,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE USER BY ID
export const updateUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, alias, email, dateOfBirth, address, role } = req.body;

    // Vérifier que c'est pas un admin
    const userToUpdate = await User.findById(userId);
    if (userToUpdate && userToUpdate.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Impossible de modifier un admin",
      });
    }

    // Vérification des champs obligatoires
    if (!name || !alias || !email || !dateOfBirth || !address) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont obligatoires",
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    // Vérifier que l'email n'existe pas déjà pour un autre utilisateur
    const emailExists = await User.findOne({ email, _id: { $ne: userId } });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    // Vérifier que l'alias n'existe pas déjà pour un autre utilisateur
    const aliasExists = await User.findOne({ alias, _id: { $ne: userId } });
    if (aliasExists) {
      return res.status(400).json({
        success: false,
        message: "Cet alias est déjà utilisé",
      });
    }

    // Préparer les données à mettre à jour
    const updateData = {
      name,
      alias,
      email,
      dateOfBirth,
      address,
    };

    // Ajouter le rôle si fourni
    if (role && ["user", "admin"].includes(role)) {
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE USER BY ID
export const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user._id;

    // Empêcher un utilisateur de se supprimer lui-même
    if (userId === currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte",
      });
    }

    const user = await User.findById(userId);

    // Empêcher de supprimer un admin
    if (user && user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Impossible de supprimer un admin",
      });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès",
      deletedUser: deletedUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// SEARCH USERS (EXCLURE LES ADMINS)
export const searchUsers = async (req, res) => {
  try {
    const { searchTerm, role, isVerified, page = 1, limit = 10 } = req.query;

    // Construire le filtre - EXCLURE LES ADMINS PAR DÉFAUT
    let filter = { role: { $ne: "admin" } };

    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { alias: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (role && ["user"].includes(role)) {
      filter.role = role;
    }

    if (isVerified !== undefined) {
      filter.isVerified = isVerified === "true";
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(filter)
      .select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt")
      .skip(skip)
      .limit(limitNum);

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limitNum);

    res.status(200).json({
      success: true,
      message: "Recherche effectuée",
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

// GET USER PROFILE (l'utilisateur connecté)
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profil récupéré",
      user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET USERS BY ROLE (EXCLURE LES ADMINS)
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide",
      });
    }

    // Empêcher de récupérer les admins
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
    }

    const users = await User.find({ role })
      .select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    res.status(200).json({
      success: true,
      message: `Utilisateurs avec le rôle ${role} récupérés`,
      users,
      count: users.length,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET VERIFIED USERS (EXCLURE LES ADMINS)
export const getVerifiedUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: true, role: { $ne: "admin" } })
      .select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    res.status(200).json({
      success: true,
      message: "Utilisateurs vérifiés récupérés",
      users,
      count: users.length,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET UNVERIFIED USERS (EXCLURE LES ADMINS)
export const getUnverifiedUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: false, role: { $ne: "admin" } })
      .select("-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt");

    res.status(200).json({
      success: true,
      message: "Utilisateurs non vérifiés récupérés",
      users,
      count: users.length,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};