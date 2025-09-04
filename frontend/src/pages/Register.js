import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/admin/register', {
        nom,
        email,
        motDePasse
      });

      // Stocker le token
      localStorage.setItem('token', res.data.token);
      setMessage('✅ Inscription réussie');
    } catch (err) {
      setMessage('❌ Erreur: ' + err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div>
      <h2>Créer un compte Admin</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
        /><br />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
        /><br />
        <button type="submit">S'inscrire</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default Register;
