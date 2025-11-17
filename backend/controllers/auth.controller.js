import { User } from "../models/user.model.js";
//Cette import permet d'accéder à TOUTES les méthodes Mongoose
//Sans cette ligne, le controller ne peut pas parler à MongoDB
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

//SIGNUP 
export const signup = async (req, res) => {
  //recuperer les donnees
  const { name, alias, email, dateOfBirth, address, password, confirmPassword } = req.body;

  try {
    // Validation des champs
    if (!name || !alias || !email || !dateOfBirth || !address || !password || !confirmPassword) {
      throw new Error("Tous les champs sont obligatoires");
    }
    
    // Validation du format de l'email avec regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Format d'email invalide" 
      });
    }

    // Vérification que les mots de passe correspondent
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Les mots de passe ne correspondent pas" 
      });
    }

    // Vérification de la longueur du mot de passe
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Le mot de passe doit contenir au moins 8 caractères" 
      });
    }

    // NOUVELLE VALIDATION : Vérifier que l'utilisateur a au moins 15 ans
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Ajuster l'âge si l'anniversaire n'est pas encore passé cette année
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 15) {
      return res.status(400).json({ 
        success: false, 
        message: "Vous devez avoir au moins 15 ans pour vous inscrire" 
      });
    }

    // Vérifier si l'email existe déjà
    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res.status(400).json({ 
        success: false, 
        message: "Un utilisateur avec cet email existe déjà" 
      });
    }

    // Vérifier si l'alias existe déjà
    const aliasAlreadyExists = await User.findOne({ alias });
    if (aliasAlreadyExists) {
      return res.status(400).json({ 
        success: false, 
        message: "Cet alias est déjà utilisé" 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcryptjs.hash(password, 10);


    // Créer le nouvel utilisateur
    const user = new User({//creation dune instance dans le memoire
      name,
      alias,
      email,
      dateOfBirth,
      address,
      password: hashedPassword
    });

    await user.save();

    // Générer JWT et cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: {
        _id: user._id,
        name: user.name,
        alias: user.alias,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//LOGIN 
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw new Error("Tous les champs sont obligatoires");
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Format d'email invalide" 
      });
    }

    // ✅ AMÉLIORATION : Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Utilisateur non trouvé" 
      });
    }

    // ✅ AMÉLIORATION : Vérifier le mot de passe séparément
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Mot de passe incorrect" 
      });
    }

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Générer JWT et cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      user: {
        _id: user._id,
        name: user.name,
        alias: user.alias,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        profilePhoto: user.profilePhoto  
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Déconnexion réussie" });
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.user:', req.user);

    const userId = req.user._id;
    const { name, alias, email, dateOfBirth, address, profilePhoto } = req.body;

    if (!name || !alias || !email || !dateOfBirth || !address) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont obligatoires"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide"
      });
    }

    const emailExists = await User.findOne({ email, _id: { $ne: userId } });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé"
      });
    }

    const aliasExists = await User.findOne({ alias, _id: { $ne: userId } });
    if (aliasExists) {
      return res.status(400).json({
        success: false,
        message: "Cet alias est déjà utilisé"
      });
    }

    const updateData = { name, alias, email, dateOfBirth, address };

    // Ajouter la photo si elle est fournie et valide
    if (profilePhoto && typeof profilePhoto === 'string' && profilePhoto.startsWith('data:')) {
      updateData.profilePhoto = profilePhoto;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      user: {
        _id: user._id,
        name: user.name,
        alias: user.alias,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        role: user.role,
        isVerified: user.isVerified,
        profilePhoto: user.profilePhoto,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  const userId = req.user._id;
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "L'ancien et le nouveau mot de passe sont obligatoires"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    const isOldPasswordValid = await bcryptjs.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "L'ancien mot de passe est incorrect"
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mot de passe changé avec succès"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};