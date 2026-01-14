import express from "express";
import {
  getDashboardStats,
  getAllIdeasAdmin,
  deleteIdeaAdmin,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkAdminRole, logAdminAction, validateAdminInput } from "../middleware/admin.middleware.js";

const router = express.Router();

// ====== Routes Admin protégées ======


// Dashboard Statistics
router.get("/dashboard-stats", verifyToken, checkAdminRole, logAdminAction, getDashboardStats);


// Ideas moderation
router.get("/ideas", verifyToken, checkAdminRole, logAdminAction, getAllIdeasAdmin);
router.delete("/ideas/:id", verifyToken, checkAdminRole, logAdminAction, deleteIdeaAdmin);



export default router;