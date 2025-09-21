const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');

const authAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'AccÃ¨s refusÃ©. Aucun token fourni.' });
    }

    try {
        const decoded = jwt.verify(token, 'jwt_secret_key');
        const admin = await Admin.findById(decoded.id);
        
        if (!admin) {
            return res.status(401).json({ message: 'Admin non trouvÃ©' });
        }

        req.adminId = decoded.id;
        req.admin = admin; // Ajouter l'objet admin complet Ã  la requÃªte
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token invalide.' });
    }
};

module.exports = authAdmin;






