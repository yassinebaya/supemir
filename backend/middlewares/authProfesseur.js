const jwt = require('jsonwebtoken');

const authProfesseur = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'AccÃ¨s refusÃ©. Aucun token fourni.' });
  }

  try {
    const decoded = jwt.verify(token, 'jwt_secret_key');

    // ØªØ£ÙƒØ¯ Ø£Ù† Ø§Ù„Ø¯ÙˆØ± Ù‡Ùˆ "prof"
    if (decoded.role !== 'prof') {
      return res.status(403).json({ message: 'AccÃ¨s non autorisÃ© (rÃ´le incorrect).' });
    }

    req.professeurId = decoded.id; // Ø­ÙØ¸ Ø§Ù„Ù…Ø¹Ø±Ù Ù„Ù„Ø§Ø³ØªØ¹Ù…Ø§Ù„ Ù„Ø§Ø­Ù‚Ø§Ù‹
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};

module.exports = authProfesseur;







