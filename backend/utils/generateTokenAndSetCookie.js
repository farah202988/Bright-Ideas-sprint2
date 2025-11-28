import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  // ✅ CRÉER LE JWT
  //“Crée un token avec l’ID du user, signe-le avec la clé secrète du serveur, et fais-le expirer dans 7 jours.”
  const token = jwt.sign(//jwt.sign() sert à créer un token JWT
    { userId },                          // ← Payload (données encodées)
    process.env.JWT_SECRET,              // ← Clé secrète pour signer
    { expiresIn: "7d" }                 // ← Après 7 jours → le token n'est plus valide → l'utilisateur doit se reconnecter
  );


  // ✅ ENVOYER LE JWT DANS UN COOKIE HTTP
  res.cookie("token", token, {
    httpOnly: true,                     // ← JavaScript ne peut pas y accéder(protège contre les attaques XSS)
    secure: process.env.NODE_ENV === "production", // ←le cookie sera envoyé seulement en HTTPS
    sameSite: "strict",                 // ← Le cookie n’est pas envoyé si la requête vient d’un autre site
    maxAge: 7 * 24 * 60 * 60 * 1000,   // ← 7 jours en millisecondes
  });

};
