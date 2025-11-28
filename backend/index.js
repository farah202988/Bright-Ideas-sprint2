import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";

// Chargement des variables d'environnement
dotenv.config();

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 5000;

// ====== MIDDLEWARES ======

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Cookie Parser 
app.use(cookieParser());

// Parser JSON (avec limite pour les images en base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ====== ROUTES ======

// Route de test
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// Routes d'authentification
app.use("/api/auth", authRoutes);

// Routes des utilisateurs
app.use("/api/users", userRoutes);

// Routes d'administration
app.use("/api/admin", adminRoutes);

// ====== ERROR HANDLER ======

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found" 
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("❌ Erreur:", err);
  res.status(500).json({ 
    success: false, 
    message: err.message || "Internal server error" 
  });
});

// ====== DÉMARRAGE DU SERVEUR ======

app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`✅ Server is running on port ${PORT}`);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
});