const mongoose = require('mongoose');

const actualiteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['evenements', 'resultats', 'pedagogie', 'communaute', 'partenariats'], required: true },
  author: { type: String, required: true },
  date: { type: Date, default: Date.now },
  image: { type: String },
  isPinned: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  type: { type: String, enum: ['article', 'event', 'announcement', 'achievement', 'project'], default: 'article' }
});

module.exports = mongoose.model('Actualite', actualiteSchema);
