const mongoose = require('mongoose');

const coursSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
professeur: {
  type: [String], 
  required: true,
  default: []
},
}, { timestamps: true });

module.exports = mongoose.model('Cours', coursSchema);







