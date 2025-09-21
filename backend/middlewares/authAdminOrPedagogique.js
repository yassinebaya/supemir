// Middleware combiné pour admin et pédagogique
const authAdminOrPedagogique = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, 'jwt_secret_key');
    
    // Vérifier si c'est un admin
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({ message: 'Admin non trouvé' });
      }
      req.user = {
        id: decoded.id,
        role: 'admin',
        nom: decoded.nom
      };
      req.adminId = decoded.id;
      req.admin = admin;
      return next();
    }
    
    // Vérifier si c'est un pédagogique
    if (decoded.role === 'pedagogique') {
      if (Pedagogique) {
        const pedagogique = await Pedagogique.findById(decoded.id);
        if (!pedagogique || !pedagogique.actif) {
          return res.status(401).json({ message: 'Compte pédagogique invalide' });
        }
        req.user = {
          id: decoded.id,
          role: 'pedagogique',
          filiere: pedagogique.filiere,
          nom: decoded.nom,
          estGeneral: pedagogique.filiere === 'GENERAL'
        };
      } else {
        req.user = {
          id: decoded.id,
          role: 'pedagogique',
          filiere: decoded.filiere,
          nom: decoded.nom,
          estGeneral: decoded.filiere === 'GENERAL'
        };
      }
      return next();
    }
    
    return res.status(403).json({ message: 'Accès refusé - Rôle admin ou pédagogique requis' });
    
  } catch (error) {
    console.error('Erreur auth:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};
