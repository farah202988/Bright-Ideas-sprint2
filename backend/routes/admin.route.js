import express from "express";
import {
  getDashboardStats,
  verifyUserEmail,
  changeUserRole,
  getUserActivityLog,
  getUsersWithFilters,
  exportUsersData,
  bulkDeleteUsers,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkAdminRole, logAdminAction, validateAdminInput } from "../middleware/admin.middleware.js";

const router = express.Router();

// ====== Routes Admin protégées ======


// Dashboard Statistics
router.get("/dashboard-stats", verifyToken, checkAdminRole, logAdminAction, getDashboardStats);

// Users Activity Log
router.get("/activity-log", verifyToken, checkAdminRole, logAdminAction, getUserActivityLog);

// Get Users with Filters (search, role filter, pagination, sorting)
router.get("/users-filtered", verifyToken, checkAdminRole, logAdminAction, getUsersWithFilters);

// Verify User Email
router.put("/verify-user/:id", verifyToken, checkAdminRole, logAdminAction, verifyUserEmail);

// Change User Role
router.put("/change-role/:id", verifyToken, checkAdminRole, logAdminAction, validateAdminInput, changeUserRole);

// Export Users Data (CSV)
router.get("/export-users", verifyToken, checkAdminRole, logAdminAction, exportUsersData);

// Bulk Delete Users
router.delete("/bulk-delete", verifyToken, checkAdminRole, logAdminAction, validateAdminInput, bulkDeleteUsers);

export default router;