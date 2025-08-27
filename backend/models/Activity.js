const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['sport', 'culture', 'science', 'art', 'sortie', 'ceremonie']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  fullDescription: {
    type: String,
    trim: true
  },
  participants: {
    type: Number,
    min: 0
  },
  lieu: {
    type: String,
    trim: true
  },
  organisateur: {
    type: String,
    trim: true
  },
  materiel: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true,
    required: true
  }],
  year: {
    type: String,
    required: true,
    match: /^\d{4}\/\d{4}$/
  },
  cycle: {
    type: String,
    required: true,
    enum: ['creche', 'primaire', 'college', 'lycee']
  }
}, { 
  timestamps: true 
});

// Index pour améliorer les performances de recherche
ActivitySchema.index({ cycle: 1, year: 1, category: 1 });
ActivitySchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Activity', ActivitySchema);