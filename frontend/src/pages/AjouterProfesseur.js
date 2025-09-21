import React, { useState, useEffect } from 'react';

const AjouterProfesseur = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    cours: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/professeurs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          cours: formData.cours.split(',').map(c => c.trim())
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Erreur');
      } else {
        setMessage('✅ Professeur créé avec succès');
        setFormData({ nom: '', email: '', motDePasse: '', cours: '' });
      }
    } catch (err) {
      setMessage('❌ Erreur lors de l’envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Ajouter un Professeur</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="nom"
          placeholder="Nom complet"
          value={formData.nom}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          name="motDePasse"
          placeholder="Mot de passe"
          value={formData.motDePasse}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="cours"
          placeholder="Cours (séparés par virgule)"
          value={formData.cours}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Création...' : 'Créer le professeur'}
        </button>
      </form>

      {message && (
        <div className="mt-4 text-sm text-center text-red-600">{message}</div>
      )}
    </div>
  );
};

export default AjouterProfesseur;
