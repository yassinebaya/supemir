const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Administratif = require('../models/Administratif');

const authAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }

    try {
        const decoded = jwt.verify(token, 'jwt_secret_key');
        console.log('Token décodé:', decoded);

        // Essayer de trouver d'abord dans Admin
        let user = await Admin.findById(decoded.id);
        let userType = 'admin';

        // Si pas trouvé dans Admin, chercher dans Administratif
        if (!user) {
            user = await Administratif.findById(decoded.id);
            userType = 'administratif';
        }

        // Si toujours pas trouvé
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérifier si c'est un utilisateur administratif et s'il est actif
        if (userType === 'administratif' && !user.actif) {
            return res.status(403).json({ message: 'Compte administratif inactif' });
        }

        // Ajouter les informations à la requête
        req.adminId = user._id;
        req.admin = user;
        req.userType = userType; // 'admin' ou 'administratif'
        
        // Pour compatibilité avec le middleware administratif
        if (userType === 'administratif') {
            req.userId = user._id;
            req.user = user;
            req.userRole = 'administratif';
            req.administratifId = user._id;
        }

        console.log(`✅ Authentification réussie pour ${userType}:`, user.email);
        
        next();
    } catch (err) {
        console.error('❌ Erreur authAdmin:', err);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token invalide' });
        }
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expiré' });
        }
        
        return res.status(500).json({ 
            message: 'Erreur serveur lors de l\'authentification',
            error: err.message
        });
    }
};

module.exports = authAdmin;