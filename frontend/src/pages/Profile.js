import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Phone, 
  User, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  GraduationCap,
  MapPin,
  CreditCard,
  FileText,
  Award,
  Edit2,
  Save,
  X as CloseIcon,
  Upload
} from 'lucide-react';
import Sidebar from '../components/sidebaretudiant';
import { useNavigate } from 'react-router-dom';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const ProfileEtudiant = () => {
  const [etudiant, setEtudiant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // États pour les champs modifiables
  const [formData, setFormData] = useState({
    telephone: '',
    telephoneResponsable: '',
    dateNaissance: '',
    lieuNaissance: '',
    pays: '',
    cin: '',
    codeMassar: '',
    passeport: '',
    codeBaccalaureat: '',
    serieBaccalaureat: '',
    anneeBaccalaureat: '',
    lieuObtentionDiplome: '',
    diplomeAcces: '',
    specialiteDiplomeAcces: '',
    mention: '',
    email: '',
    nouveauMotDePasse: '',
    motDePasseActuel: ''
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState({});
  const navigate = useNavigate();

  // Liste des pays
  const listePays = [
    'Maroc', 'France', 'Algérie', 'Tunisie', 'Sénégal', 'Côte d\'Ivoire',
    'Mali', 'Mauritanie', 'Cameroun', 'Gabon', 'Congo', 'Bénin',
    'Burkina Faso', 'Niger', 'Tchad', 'Guinée', 'Madagascar',
    'Belgique', 'Suisse', 'Canada', 'États-Unis', 'Espagne',
    'Allemagne', 'Italie', 'Portugal', 'Royaume-Uni', 'Pays-Bas'
  ].sort();

  // Types de documents uploadables
  const typesDocuments = [
    { key: 'documentCin', label: 'CIN' },
    { key: 'documentBacCommentaire', label: 'Baccalauréat' },
    { key: 'documentReleveNoteBac', label: 'Relevé de notes Bac' },
    { key: 'documentDiplomeCommentaire', label: 'Diplôme' },
    { key: 'documentAttestationReussiteCommentaire', label: 'Attestation de réussite' },
    { key: 'documentPasseport', label: 'Passeport' }
  ];

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (role !== 'etudiant' || !token) {
      navigate('/');
      return;
    }

    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://195.179.229.230:5000/api/etudiant/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Échec de chargement du profil');

      const data = await res.json();
      setEtudiant(data);
      
      // Initialiser formData avec les données existantes
      setFormData({
        telephone: data.telephone || '',
        telephoneResponsable: data.telephoneResponsable || '',
        dateNaissance: data.dateNaissance ? data.dateNaissance.split('T')[0] : '',
        lieuNaissance: data.lieuNaissance || '',
        pays: data.pays || '',
        cin: data.cin || '',
        codeMassar: data.codeMassar || '',
        passeport: data.passeport || '',
        codeBaccalaureat: data.codeBaccalaureat || '',
        serieBaccalaureat: data.serieBaccalaureat || '',
        anneeBaccalaureat: data.anneeBaccalaureat || '',
        lieuObtentionDiplome: data.lieuObtentionDiplome || '',
        diplomeAcces: data.diplomeAcces || '',
        specialiteDiplomeAcces: data.specialiteDiplomeAcces || '',
        mention: data.mention || '',
        email: data.email || '',
        nouveauMotDePasse: '',
        motDePasseActuel: ''
      });
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setMessage({ type: 'error', text: 'Erreur de chargement du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 5 MB' });
        return;
      }
      setSelectedImage(file);
    }
  };

  const handleDocumentChange = (e, documentKey) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Le document ne doit pas dépasser 5 MB' });
        return;
      }
      setSelectedDocuments(prev => ({
        ...prev,
        [documentKey]: file
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Ajouter tous les champs modifiables
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Ajouter l'image si sélectionnée
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      // Ajouter les documents si sélectionnés
      Object.keys(selectedDocuments).forEach(key => {
        if (selectedDocuments[key]) {
          formDataToSend.append(key, selectedDocuments[key]);
        }
      });

      const res = await fetch('http://195.179.229.230:5000/api/etudiant/mon-profil', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setEtudiant(data.etudiant);
      setEditMode(false);
      setSelectedImage(null);
      setSelectedDocuments({});
      
      // Réinitialiser les champs de mot de passe
      setFormData(prev => ({
        ...prev,
        nouveauMotDePasse: '',
        motDePasseActuel: ''
      }));

      // Rafraîchir le profil
      setTimeout(() => {
        fetchProfile();
      }, 1000);

    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setSelectedImage(null);
    setSelectedDocuments({});
    setMessage({ type: '', text: '' });
    // Restaurer les données originales
    if (etudiant) {
      setFormData({
        telephone: etudiant.telephone || '',
        telephoneResponsable: etudiant.telephoneResponsable || '',
        dateNaissance: etudiant.dateNaissance ? etudiant.dateNaissance.split('T')[0] : '',
        lieuNaissance: etudiant.lieuNaissance || '',
        pays: etudiant.pays || '',
        cin: etudiant.cin || '',
        codeMassar: etudiant.codeMassar || '',
        passeport: etudiant.passeport || '',
        codeBaccalaureat: etudiant.codeBaccalaureat || '',
        serieBaccalaureat: etudiant.serieBaccalaureat || '',
        anneeBaccalaureat: etudiant.anneeBaccalaureat || '',
        lieuObtentionDiplome: etudiant.lieuObtentionDiplome || '',
        diplomeAcces: etudiant.diplomeAcces || '',
        specialiteDiplomeAcces: etudiant.specialiteDiplomeAcces || '',
        mention: etudiant.mention || '',
        email: etudiant.email || '',
        nouveauMotDePasse: '',
        motDePasseActuel: ''
      });
    }
  };

  const calculerAge = (dateNaissance) => {
    if (!dateNaissance) return 'N/A';
    const dob = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} ans`;
  };

  const formaterDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getNomComplet = (etudiant) => {
    return `${etudiant.prenom || ''} ${etudiant.nomDeFamille || ''}`.trim();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Chargement du profil...</p>
      </div>
    );
  }

  if (!etudiant) {
    return (
      <div style={styles.errorContainer}>
        <XCircle size={48} color="#ef4444" />
        <p style={styles.errorText}>Étudiant non trouvé</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar onLogout={handleLogout} />

      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Mon Profil</h1>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              style={styles.editButton}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
            >
              <Edit2 size={18} />
              Modifier le profil
            </button>
          ) : (
            <div style={styles.actionButtons}>
              <button
                onClick={handleCancel}
                style={styles.cancelButton}
                disabled={saving}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9ca3af'}
              >
                <CloseIcon size={18} />
                Annuler
              </button>
              <button
                onClick={handleSave}
                style={styles.saveButton}
                disabled={saving}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
              >
                <Save size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message de feedback */}
      {message.text && (
        <div style={{
          ...styles.messageBox,
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Profile Card */}
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarContainer}>
              {editMode && (
                <label style={styles.imageUploadLabel}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <Upload size={20} />
                </label>
              )}
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Profil"
                  style={styles.avatar}
                />
              ) : etudiant.image ? (
                <img
                  src={`http://195.179.229.230:5000${etudiant.image}`}
                  alt="Profil"
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <User size={40} color="#6b7280" />
                </div>
              )}
              <div style={styles.statusBadge}>
                {etudiant.actif ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : (
                  <XCircle size={16} color="#ef4444" />
                )}
              </div>
            </div>
            <div style={styles.profileInfo}>
              <h2 style={styles.profileName}>{getNomComplet(etudiant)}</h2>
              {editMode ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Email"
                />
              ) : (
                <p style={styles.profileEmail}>{etudiant.email}</p>
              )}
              <div style={styles.statusContainer}>
                <span style={{
                  ...styles.statusText,
                  color: etudiant.actif ? '#10b981' : '#ef4444'
                }}>
                  {etudiant.actif ? 'Compte Actif' : 'Compte Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div style={styles.cardsGrid}>
          {/* Personal Information */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <User size={20} color="#4f46e5" />
              <h3 style={styles.cardTitle}>Informations Personnelles</h3>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.infoItem}>
                <Phone size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Téléphone</span>
                  {editMode ? (
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.telephone}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <Phone size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Téléphone Responsable</span>
                  {editMode ? (
                    <input
                      type="tel"
                      name="telephoneResponsable"
                      value={formData.telephoneResponsable}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.telephoneResponsable || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <Calendar size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Date de naissance</span>
                  {editMode ? (
                    <input
                      type="date"
                      name="dateNaissance"
                      value={formData.dateNaissance}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>
                      {formaterDate(etudiant.dateNaissance)} ({calculerAge(etudiant.dateNaissance)})
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <MapPin size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Lieu de naissance</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="lieuNaissance"
                      value={formData.lieuNaissance}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.lieuNaissance || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <MapPin size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Pays</span>
                  {editMode ? (
                    <select
                      name="pays"
                      value={formData.pays}
                      onChange={handleInputChange}
                      style={styles.input}
                    >
                      <option value="">Sélectionnez un pays</option>
                      {listePays.map(pays => (
                        <option key={pays} value={pays}>{pays}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={styles.infoValue}>{etudiant.pays || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <GraduationCap size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Genre</span>
                  <span style={styles.infoValue}>{etudiant.genre}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents d'identité */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <FileText size={20} color="#dc2626" />
              <h3 style={styles.cardTitle}>Documents d'Identité</h3>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.infoItem}>
                <FileText size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>CIN</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="cin"
                      value={formData.cin}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.cin || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <FileText size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Code Massar</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="codeMassar"
                      value={formData.codeMassar}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.codeMassar || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <FileText size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Passeport</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="passeport"
                      value={formData.passeport}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.passeport || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <FileText size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Code Baccalauréat</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="codeBaccalaureat"
                      value={formData.codeBaccalaureat}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.codeBaccalaureat || 'N/A'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <Award size={20} color="#7c3aed" />
              <h3 style={styles.cardTitle}>Informations Académiques (Non modifiables)</h3>
            </div>
            <div style={styles.cardContent}>
              {etudiant.niveau && (
                <div style={styles.infoItem}>
                  <GraduationCap size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Niveau</span>
                    <span style={styles.infoValue}>{etudiant.niveau}</span>
                  </div>
                </div>
              )}
              {etudiant.filiere && (
                <div style={styles.infoItem}>
                  <BookOpen size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Filière</span>
                    <span style={styles.infoValue}>{etudiant.filiere}</span>
                  </div>
                </div>
              )}
              {etudiant.specialite && (
                <div style={styles.infoItem}>
                  <Award size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Spécialité</span>
                    <span style={styles.infoValue}>{etudiant.specialite}</span>
                  </div>
                </div>
              )}
              {etudiant.codeEtudiant && (
                <div style={styles.infoItem}>
                  <FileText size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Code Étudiant</span>
                    <span style={styles.infoValue}>{etudiant.codeEtudiant}</span>
                  </div>
                </div>
              )}
              {etudiant.anneeScolaire && (
                <div style={styles.infoItem}>
                  <Calendar size={18} color="#6b7280" />
                  <div style={styles.infoDetails}>
                    <span style={styles.infoLabel}>Année scolaire</span>
                    <span style={styles.infoValue}>{etudiant.anneeScolaire}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Infos Baccalauréat */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <Award size={20} color="#059669" />
              <h3 style={styles.cardTitle}>Diplômes Antérieurs</h3>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.infoItem}>
                <FileText size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Série Baccalauréat</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="serieBaccalaureat"
                      value={formData.serieBaccalaureat}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.serieBaccalaureat || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <Calendar size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Année Baccalauréat</span>
                  {editMode ? (
                    <input
                      type="number"
                      name="anneeBaccalaureat"
                      value={formData.anneeBaccalaureat}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.anneeBaccalaureat || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <MapPin size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Lieu Obtention Diplôme</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="lieuObtentionDiplome"
                      value={formData.lieuObtentionDiplome}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.lieuObtentionDiplome || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <FileText size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Diplôme d'Accès</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="diplomeAcces"
                      value={formData.diplomeAcces}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.diplomeAcces || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <FileText size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Spécialité Diplôme d'Accès</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="specialiteDiplomeAcces"
                      value={formData.specialiteDiplomeAcces}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.specialiteDiplomeAcces || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div style={styles.infoItem}>
                <Award size={18} color="#6b7280" />
                <div style={styles.infoDetails}>
                  <span style={styles.infoLabel}>Mention</span>
                  {editMode ? (
                    <input
                      type="text"
                      name="mention"
                      value={formData.mention}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  ) : (
                    <span style={styles.infoValue}>{etudiant.mention || 'N/A'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Changement de mot de passe */}
          {editMode && (
            <>
              <div style={styles.infoCard}>
                <div style={styles.cardHeader}>
                  <FileText size={20} color="#dc2626" />
                  <h3 style={styles.cardTitle}>Changer le mot de passe</h3>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.infoItem}>
                    <FileText size={18} color="#6b7280" />
                    <div style={styles.infoDetails}>
                      <span style={styles.infoLabel}>Mot de passe actuel (requis)</span>
                      <input
                        type="password"
                        name="motDePasseActuel"
                        value={formData.motDePasseActuel}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Entrez votre mot de passe actuel"
                      />
                    </div>
                  </div>

                  <div style={styles.infoItem}>
                    <FileText size={18} color="#6b7280" />
                    <div style={styles.infoDetails}>
                      <span style={styles.infoLabel}>Nouveau mot de passe</span>
                      <input
                        type="password"
                        name="nouveauMotDePasse"
                        value={formData.nouveauMotDePasse}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Minimum 6 caractères"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload de documents */}
              <div style={styles.infoCard}>
                <div style={styles.cardHeader}>
                  <Upload size={20} color="#7c3aed" />
                  <h3 style={styles.cardTitle}>Uploader des documents</h3>
                </div>
                <div style={styles.cardContent}>
                  {typesDocuments.map(doc => (
                    <div key={doc.key} style={styles.infoItem}>
                      <FileText size={18} color="#6b7280" />
                      <div style={styles.infoDetails}>
                        <span style={styles.infoLabel}>{doc.label}</span>
                        <div style={styles.fileInputContainer}>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleDocumentChange(e, doc.key)}
                            style={styles.fileInput}
                            id={doc.key}
                          />
                          <label htmlFor={doc.key} style={styles.fileLabel}>
                            <Upload size={16} />
                            {selectedDocuments[doc.key] 
                              ? selectedDocuments[doc.key].name 
                              : 'Choisir un fichier'}
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p style={styles.fileHint}>Formats acceptés: PDF, JPG, PNG, DOC, DOCX (max 5 MB)</p>
                </div>
              </div>
            </>
          )}

          {/* Courses Information (Non modifiable) */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <BookOpen size={20} color="#059669" />
              <h3 style={styles.cardTitle}>Mes Classes</h3>
            </div>
            <div style={styles.cardContent}>
              {etudiant.cours && etudiant.cours.length > 0 ? (
                <div style={styles.coursesList}>
                  {etudiant.cours.map((cours, index) => (
                    <div key={index} style={styles.courseItem}>
                      <div style={styles.courseIcon}>
                        <BookOpen size={16} color="#059669" />
                      </div>
                      <span style={styles.courseName}>{cours}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.noCourses}>
                  <BookOpen size={32} color="#d1d5db" />
                  <p style={styles.noCoursesText}>Aucun cours inscrit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f3e8ff 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '1rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },

  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  actionButtons: {
    display: 'flex',
    gap: '0.75rem'
  },

  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#9ca3af',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  messageBox: {
    maxWidth: '1200px',
    margin: '1rem auto',
    padding: '1rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '14px',
    fontWeight: '500'
  },
  
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  
  profileHeader: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },

  imageUploadLabel: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '0.5rem',
    borderRadius: '50%',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #e5e7eb',
  },
  
  avatarPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #e5e7eb',
  },
  
  statusBadge: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    padding: '0.25rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  
  profileName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.5rem 0',
  },
  
  profileEmail: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 0.5rem 0',
  },
  
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  statusText: {
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f3f4f6',
  },
  
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  
  infoDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  
  infoLabel: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  infoValue: {
    fontSize: '0.875rem',
    color: '#1f2937',
    fontWeight: '500',
  },

  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  },

  fileInputContainer: {
    position: 'relative',
    width: '100%'
  },

  fileInput: {
    position: 'absolute',
    width: '0.1px',
    height: '0.1px',
    opacity: 0,
    overflow: 'hidden',
    zIndex: -1
  },

  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
    justifyContent: 'center'
  },

  fileHint: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontStyle: 'italic',
    margin: '0.5rem 0 0 0'
  },
  
  coursesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  
  courseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f0fdf4',
    borderRadius: '0.5rem',
    border: '1px solid #dcfce7',
  },
  
  courseIcon: {
    padding: '0.375rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.375rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  courseName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#065f46',
  },
  
  noCourses: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem',
    textAlign: 'center',
  },
  
  noCoursesText: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0,
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
  },
  
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  loadingText: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
  },
  
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
  },
  
  errorText: {
    fontSize: '1rem',
    color: '#ef4444',
    margin: 0,
  },
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #4f46e5 !important;
    outline: none;
  }

  label[style*="fileLabel"]:hover {
    background-color: #e5e7eb;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ProfileEtudiant;