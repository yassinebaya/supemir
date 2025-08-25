const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    motDePasse: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['global', 'inscription', 'paiement'],
        default: 'global',
        required: true
    },
    actif: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

adminSchema.methods.comparePassword = function (mot) {
    return bcrypt.compare(mot, this.motDePasse);
};

module.exports = mongoose.model('Admin', adminSchema);






