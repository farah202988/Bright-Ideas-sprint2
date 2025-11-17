import { User } from "../models/user.model.js";

/**
 * Middleware pour vérifier que l'utilisateur est admin
 * À utiliser APRÈS verifyToken
 */
export const checkAdminRole = async (req, res, next) => {
  try {
    // req.user._id devrait être défini par le middleware verifyToken
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise",
      });
    }

    // Récupérer l'utilisateur de la base de données
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier que l'utilisateur est admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource.",
      });
    }

    // Ajouter les informations de l'admin à req
    req.user.role = user.role;
    req.user.isAdmin = true;

    next();
  } catch (error) {
    console.error("Erreur dans checkAdminRole:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification des droits admin",
    });
  }
};

/**
 * Middleware pour logger les actions admin
 */
export const logAdminAction = (req, res, next) => {
  try {
    const action = `${req.method} ${req.originalUrl}`;
    const adminId = req.user?._id;
    const timestamp = new Date().toISOString();

    console.log(`[ADMIN ACTION] ${timestamp} - Admin: ${adminId} - Action: ${action}`);

    // Vous pouvez aussi sauvegarder les logs dans une base de données
    // await AdminLog.create({ adminId, action, timestamp });

    next();
  } catch (error) {
    console.error("Erreur dans logAdminAction:", error.message);
    next();
  }
};

/**
 * Middleware pour valider les données d'entrée pour les actions admin
 */
export const validateAdminInput = (req, res, next) => {
  try {
    // Vérifier les données en fonction de la route
    const method = req.method;
    const path = req.path;

    // Validation pour changement de rôle
    if (path.includes("/change-role") && method === "PUT") {
      const { role } = req.body;
      if (!role || !["user", "admin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Rôle invalide. Les rôles autorisés sont: user, admin",
        });
      }
    }

    // Validation pour suppression en masse
    if (path.includes("/bulk-delete") && method === "DELETE") {
      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Fournissez un tableau userIds non vide",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Erreur dans validateAdminInput:", error.message);
    next();
  }
};

export default checkAdminRole;