const mongoose = require('mongoose');

const NotificationSupprimeeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  etudiantId: { type: String },
  nombreAbsencesAuMomentSuppression: { type: Number, default: 0 },
  dateSuppression: { type: Date, default: Date.now },
  supprimePar: { type: String }
});

const ConfigurationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  modifiePar: { type: String },
  dateModification: { type: Date, default: Date.now }
});

module.exports = {
  NotificationSupprimee: mongoose.model('NotificationSupprimee', NotificationSupprimeeSchema),
  Configuration: mongoose.model('Configuration', ConfigurationSchema)
};







