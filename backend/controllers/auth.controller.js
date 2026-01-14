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
    // À ce stade, user._id existe déjà (généré par Mongoose)
    // mais il n'est pas encore dans MongoDB

    await user.save();//////////////////////////////    // Cette ligne envoie le document à MongoDB
    // MongoDB confirme l'enregistrement et l'_id devient définitif
    //// À ce moment, Mongoose génère **AUTOMATIQUEMENT** un _id pour le nouvel utilisateur.

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
    //Vérifier que l'email n'est pas déjà utilisé par un AUTRE utilisateur
    const emailExists = await User.findOne({ 
      email,//chercher un utilisateur avec cet email
       _id: { $ne: userId } });//ne: not equal: l'id doit être différent de userId
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé"
      });
    }

    const aliasExists = await User.findOne({ alias, _id: { $ne: userId } });//ne: not equal
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
    //Mettre à jour l'utilisateur dans la base de données
    const user = await User.findByIdAndUpdate(
      userId,//id de l'utilisateur à mettre à jour
      updateData,//les nouvelles données
      { new: true, runValidators: true }//options: new:true pour retourner le document mis à jour; runValidators:true pour appliquer les validations du schéma
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

    const isOldPasswordValid = await bcryptjs.compare(oldPassword, user.password);//comparer l'ancien mot de passe avec le mot de passe haché dans la base de données
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "L'ancien mot de passe est incorrect"
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);//hachage du nouveau mot de passe 10=nombre de salage
    user.password = hashedPassword;//mettre à jour le mot de passe
    await user.save();//sauvegarder l'utilisateur

    res.status(200).json({
      success: true,
      message: "Mot de passe changé avec succès"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};