const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String },
  cycle:     { type: String },
  subject:   { type: String, required: true },
  message:   { type: String, required: true },
  date:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);







