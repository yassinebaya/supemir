const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  fichier: { type: String, required: true }, // chemin du fichier
  cours: { type: String, required: true },   // nom du cours
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Professeur' }, // ou Admin
  dateUpload: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);







