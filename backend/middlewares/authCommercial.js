const jwt = require('jsonwebtoken');
const Commercial = require('../models/commercialModel');

const authCommercial = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token requis' });
    }

    const decoded = jwt.verify(token, 'jwt_secret_key');
    const commercial = await Commercial.findById(decoded.id);

    if (!commercial) {
      return res.status(404).json({ message: 'Commercial non trouvÃ©' });
    }

    if (!commercial.actif) {
      return res.status(403).json({ message: 'â›” Compte commercial inactif' });
    }

    req.commercialId = commercial._id;
    req.commercial = commercial;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide ou expirÃ©', error: err.message });
  }
};

module.exports = authCommercial;







