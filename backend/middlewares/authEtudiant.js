const jwt = require('jsonwebtoken');

const authEtudiant = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, 'jwt_secret_key');
    if (decoded.role !== 'etudiant') return res.status(403).json({ message: 'AccÃ¨s refusÃ©' });
    req.etudiantId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = authEtudiant;







