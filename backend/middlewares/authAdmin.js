const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Administratif = require('../models/Administratif');
const FinanceProf = require('../models/financeProfModel');
const Pedagogique = require('../models/Pedagogique');

const authAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }

    try {
        const decoded = jwt.verify(token, 'jwt_secret_key');
        console.log('Token décodé:', decoded);

        let user = null;
        let userType = null;
        let userInfo = {}; // Pour stocker les infos de traçabilité

        // Essayer de trouver d'abord dans Admin
        user = await Admin.findById(decoded.id);
        if (user) {
            userType = 'admin';
            userInfo = {
                id: user._id,
                nom: user.nom || 'Admin',
                email: user.email,
                role: 'admin',
                displayName: `Admin: ${user.nom || user.email}`
            };
        }

        // Si pas trouvé dans Admin, chercher dans Pedagogique
        if (!user) {
            user = await Pedagogique.findById(decoded.id);
            if (user) {
                userType = 'pedagogique';
                userInfo = {
                    id: user._id,
                    nom: user.nom,
                    email: user.email,
                    role: 'pedagogique',
                    filiere: user.filiere,
                    displayName: `Pédagogique: ${user.nom} (${user.filiere || 'GENERAL'})`
                };
            }
        }

        // Si pas trouvé dans Pedagogique, chercher dans Administratif
        if (!user) {
            user = await Administratif.findById(decoded.id);
            if (user) {
                userType = 'administratif';
                userInfo = {
                    id: user._id,
                    nom: user.nom,
                    email: user.email,
                    role: 'administratif',
                    displayName: `Administratif: ${user.nom}`
                };
            }
        }

        // Si pas trouvé dans Administratif, chercher dans FinanceProf
        if (!user) {
            user = await FinanceProf.findById(decoded.id);
            if (user) {
                userType = 'finance_prof';
                userInfo = {
                    id: user._id,
                    nom: user.nom,
                    email: user.email,
                    role: 'finance_prof',
                    displayName: `Finance: ${user.nom}`
                };
            }
        }

        // Si toujours pas trouvé
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérifier si l'utilisateur est actif (pour tous sauf admin)
        if (userType !== 'admin' && !user.actif) {
            const messages = {
                'administratif': 'Compte administratif inactif',
                'finance_prof': '⛔ Compte professeur inactif',
                'pedagogique': 'Compte pédagogique inactif'
            };
            return res.status(403).json({ message: messages[userType] });
        }

        // Ajouter les informations de base à la requête
        req.adminId = user._id;
        req.admin = user;
        req.userType = userType;
        req.userInfo = userInfo; // ✅ AJOUT : Informations complètes pour la traçabilité

        // Ajouter les propriétés spécifiques selon le type d'utilisateur
        switch (userType) {
            case 'pedagogique':
                req.userId = user._id;
                req.user = {
                    ...user.toObject(),
                    role: 'pedagogique',
                    id: user._id.toString(),
                    filiere: user.filiere
                };
                req.userRole = 'pedagogique';
                break;

            case 'administratif':
                req.userId = user._id;
                req.user = user;
                req.userRole = 'administratif';
                req.administratifId = user._id;
                break;
                
            case 'finance_prof':
                req.profId = user._id;
                req.prof = user;
                req.userId = user._id;
                req.user = user;
                req.userRole = 'finance_prof';
                break;
                
            case 'admin':
                req.userId = user._id;
                req.user = user;
                req.userRole = 'admin';
                break;
        }

        console.log(`✅ Authentification réussie pour ${userType}:`, user.email);
        console.log('📝 Info traçabilité:', userInfo.displayName);
        
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
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

module.exports = authAdmin;