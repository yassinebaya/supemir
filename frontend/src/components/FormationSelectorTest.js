import React, { useState } from 'react';

// STRUCTURE CORRIGÉE POUR CORRESPONDRE AU BACKEND
const STRUCTURE_FORMATION = {
  MASI: {
    nom: 'MASI',
    niveauxManuels: true,
    specialites: [
      'Entreprenariat, audit et finance',
      'Développement commercial et marketing digital'
    ],
    options: {
      // Pour MASI, la validation backend sera basée sur le niveau
    }
  },
  IRM: {
    nom: 'IRM',
    niveauxManuels: true,
    specialites: [
      'Développement informatique',
      'Réseaux et cybersécurité'
    ],
    options: {
      // Pour IRM, la validation backend sera basée sur le niveau
    }
  },
  CYCLE_INGENIEUR: {
    nom: 'École d\'Ingénieur',
    niveauxManuels: true,
    cycles: {
      'Classes Préparatoires Intégrées': {
        niveaux: [1, 2],
        specialites: [],
        options: {}
      },
      'Cycle Ingénieur': {
        niveaux: [3, 4, 5],
        specialites: [
          'Génie Informatique',
          'Génie Mécatronique',
          'Génie Civil'
        ],
        options: {
          'Génie Informatique': [
            'Sécurité & Mobilité Informatique',
            'IA & Science des Données',
            'Réseaux & Cloud Computing'
          ],
          'Génie Mécatronique': [
            'Génie Mécanique',
            'Génie Industriel',
            'Automatisation'
          ],
          'Génie Civil': [
            'Structures & Ouvrages d\'art',
            'Bâtiment & Efficacité Énergétique',
            'Géotechnique & Infrastructures'
          ]
        }
      }
    }
  },
  LICENCE_PRO: {
    nom: 'Licence Professionnelle',
    typeFormation: 'LICENCE_PRO',
    niveauxManuels: false,
    niveauFixe: 3,
    // SPÉCIALITÉS EXACTEMENT COMME DANS LE BACKEND
    specialites: [
      'Marketing digital e-business Casablanca',
      'Tests Logiciels avec Tests Automatisés',
      'Gestion de la Qualité',
      'Développement Informatique Full Stack',
      'Administration des Systèmes, Bases de Données, Cybersécurité et Cloud Computing',
      'Réseaux et Cybersécurité',
      'Finance, Audit & Entrepreneuriat',
      'Développement Commercial et Marketing Digital',
      'Management et Conduite de Travaux – Cnam',
      'Electrotechnique et systèmes – Cnam',
      'Informatique – Cnam'
    ],
    // OPTIONS EXACTEMENT COMME DANS LA VALIDATION BACKEND
    options: {
      'Développement Informatique Full Stack': [
        'Développement Mobile',
        'Intelligence Artificielle et Data Analytics',
        'Développement JAVA JEE',
        'Développement Gaming et VR'
      ],
      'Réseaux et Cybersécurité': [
        'Administration des Systèmes et Cloud Computing'
      ]
    }
  },
  MASTER_PRO: {
    nom: 'Master Professionnel',
    typeFormation: 'MASTER_PRO',
    niveauxManuels: false,
    niveauFixe: 4,
    // SPÉCIALITÉS EXACTEMENT COMME DANS LE BACKEND
    specialites: [
      'Informatique, Data Sciences, Cloud, Cybersécurité & Intelligence Artificielle (DU IDCIA)',
      'QHSSE & Performance Durable',
      'Achat, Logistique et Supply Chain Management',
      'Management des Systèmes d\'Information',
      'Big Data et Intelligence Artificielle',
      'Cybersécurité et Transformation Digitale',
      'Génie Informatique et Innovation Technologique',
      'Finance, Audit & Entrepreneuriat',
      'Développement Commercial et Marketing Digital'
    ],
    // OPTIONS EXACTEMENT COMME DANS LA VALIDATION BACKEND
    options: {
      'Cybersécurité et Transformation Digitale': [
        'Systèmes de communication et Data center',
        'Management des Systèmes d\'Information'
      ],
      'Génie Informatique et Innovation Technologique': [
        'Génie Logiciel',
        'Intelligence Artificielle et Data Science'
      ]
    }
  }
};

// Fonctions utilitaires mises à jour
const getCycleParNiveau = (niveau) => {
  const niveauInt = parseInt(niveau);
  if (niveauInt <= 2) return 'Classes Préparatoires Intégrées';
  if (niveauInt >= 3) return 'Cycle Ingénieur';
  return '';
};

const getSpecialitesDisponibles = (filiere, niveau) => {
  const formationData = STRUCTURE_FORMATION[filiere];
  if (!formationData) return [];
  
  // Pour LICENCE_PRO et MASTER_PRO, retourner toutes les spécialités
  if (filiere === 'LICENCE_PRO' || filiere === 'MASTER_PRO') {
    return formationData.specialites || [];
  }
  
  // Pour MASI et IRM, logique basée sur le niveau (selon validation backend)
  const niveauInt = parseInt(niveau);
  if (niveauInt < 3) return [];
  
  if (filiere === 'MASI') {
    if (niveauInt === 3) {
      return ['Entreprenariat, audit et finance', 'Développement commercial et marketing digital'];
    } else if (niveauInt >= 4) {
      return ['Management des affaires et systèmes d\'information'];
    }
  }
  
  if (filiere === 'IRM') {
    if (niveauInt === 3) {
      return ['Développement informatique', 'Réseaux et cybersécurité'];
    } else if (niveauInt >= 4) {
      return ['Génie informatique et innovation technologique', 'Cybersécurité et transformation digitale'];
    }
  }
  
  return formationData.specialites || [];
};

const getOptionsDisponibles = (filiere, niveau, specialite) => {
  const formationData = STRUCTURE_FORMATION[filiere];
  if (!formationData || !specialite) return [];
  
  return formationData.options[specialite] || [];
};

const getSpecialitesIngenieur = (cycle) => {
  if (!cycle || !STRUCTURE_FORMATION.CYCLE_INGENIEUR.cycles[cycle]) return [];
  return STRUCTURE_FORMATION.CYCLE_INGENIEUR.cycles[cycle].specialites || [];
};

// Composant FormationSelector corrigé
const FormationSelector = ({ form, onChange, prefix = '' }) => {
  const formationData = form.filiere ? STRUCTURE_FORMATION[form.filiere] : null;
  const isIngenieur = form.filiere === 'CYCLE_INGENIEUR';
  const hasNiveauFixe = formationData && !formationData.niveauxManuels;
  
  // Pour les formations avec niveau auto-assigné, afficher le niveau fixe
  const niveauAffiche = hasNiveauFixe ? formationData.niveauFixe : form.niveau;
  
  return (
    <div className="formation-selector" style={{ border: '2px solid #007bff', padding: '20px', margin: '20px', borderRadius: '8px' }}>
      <h3 style={{ color: '#007bff', marginBottom: '20px' }}>Sélecteur de Formation - Version Corrigée</h3>
      
      <div className="form-row">
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Type de Formation *
          </label>
          <select
            name="filiere"
            value={form.filiere}
            onChange={(e) => onChange('filiere', e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '2px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner le type de formation...</option>
            <option value="MASI">MASI (Ancienne formation)</option>
            <option value="IRM">IRM (Ancienne formation)</option>
            <option value="CYCLE_INGENIEUR">École d'Ingénieur</option>
            <option value="LICENCE_PRO">Licence Professionnelle</option>
            <option value="MASTER_PRO">Master Professionnel</option>
          </select>
        </div>
        
        {/* Niveau */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Niveau
            {hasNiveauFixe && (
              <span style={{ color: '#28a745', fontSize: '12px' }}> (Auto-assigné)</span>
            )}
          </label>
          {hasNiveauFixe ? (
            <input
              type="text"
              value={`Niveau ${niveauAffiche}`}
              disabled
              style={{ 
                width: '100%', 
                padding: '10px', 
                backgroundColor: '#e9f7ef', 
                color: '#155724',
                border: '2px solid #28a745',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            />
          ) : (
            <select
              name="niveau"
              value={form.niveau || ''}
              onChange={(e) => onChange('niveau', e.target.value)}
              required={form.filiere && !hasNiveauFixe}
              style={{ width: '100%', padding: '10px', border: '2px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            >
              <option value="">Sélectionner le niveau...</option>
              <option value="1">1ère année</option>
              <option value="2">2ème année</option>
              <option value="3">3ème année</option>
              <option value="4">4ème année</option>
              <option value="5">5ème année</option>
            </select>
          )}
        </div>
      </div>
      
      {/* Cycle pour École d'Ingénieur */}
      {isIngenieur && form.niveau && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Cycle *</label>
          <input
            type="text"
            value={form.cycle || getCycleParNiveau(form.niveau)}
            disabled
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#e3f2fd', 
              color: '#0d47a1',
              border: '2px solid #2196f3',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          <small style={{color: '#666', fontSize: '12px'}}>
            Le cycle est déterminé automatiquement selon le niveau
          </small>
        </div>
      )}
      
      {/* Spécialité d'Ingénieur */}
      {isIngenieur && form.niveau >= 3 && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Spécialité d'Ingénieur *
          </label>
          <select
            name="specialiteIngenieur"
            value={form.specialiteIngenieur || ''}
            onChange={(e) => onChange('specialiteIngenieur', e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '2px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner la spécialité...</option>
            {getSpecialitesIngenieur('Cycle Ingénieur').map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Option d'Ingénieur */}
      {isIngenieur && form.niveau == 5 && form.specialiteIngenieur && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Option d'Ingénieur *
          </label>
          <select
            name="optionIngenieur"
            value={form.optionIngenieur || ''}
            onChange={(e) => onChange('optionIngenieur', e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '2px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner l'option...</option>
            {getOptionsDisponibles('CYCLE_INGENIEUR', form.niveau, form.specialiteIngenieur).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Spécialité Licence Pro - DONNÉES CORRIGÉES */}
      {form.filiere === 'LICENCE_PRO' && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Spécialité Licence Pro *
          </label>
          <select
            name="specialiteLicencePro"
            value={form.specialiteLicencePro || ''}
            onChange={(e) => onChange('specialiteLicencePro', e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '2px solid #ffc107', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner une spécialité...</option>
            {STRUCTURE_FORMATION.LICENCE_PRO.specialites.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Option Licence Pro - DONNÉES CORRIGÉES */}
      {form.filiere === 'LICENCE_PRO' && form.specialiteLicencePro && STRUCTURE_FORMATION.LICENCE_PRO.options[form.specialiteLicencePro] && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Option Licence Pro</label>
          <select
            name="optionLicencePro"
            value={form.optionLicencePro || ''}
            onChange={(e) => onChange('optionLicencePro', e.target.value)}
            style={{ width: '100%', padding: '10px', border: '2px solid #ffc107', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner une option...</option>
            {STRUCTURE_FORMATION.LICENCE_PRO.options[form.specialiteLicencePro].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Spécialité Master Pro - DONNÉES CORRIGÉES */}
      {form.filiere === 'MASTER_PRO' && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Spécialité Master Pro *
          </label>
          <select
            name="specialiteMasterPro"
            value={form.specialiteMasterPro || ''}
            onChange={(e) => onChange('specialiteMasterPro', e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '2px solid #dc3545', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner une spécialité...</option>
            {STRUCTURE_FORMATION.MASTER_PRO.specialites.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Option Master Pro - DONNÉES CORRIGÉES */}
      {form.filiere === 'MASTER_PRO' && form.specialiteMasterPro && STRUCTURE_FORMATION.MASTER_PRO.options[form.specialiteMasterPro] && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Option Master Pro</label>
          <select
            name="optionMasterPro"
            value={form.optionMasterPro || ''}
            onChange={(e) => onChange('optionMasterPro', e.target.value)}
            style={{ width: '100%', padding: '10px', border: '2px solid #dc3545', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner une option...</option>
            {STRUCTURE_FORMATION.MASTER_PRO.options[form.specialiteMasterPro].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Spécialité pour MASI/IRM */}
      {(form.filiere === 'MASI' || form.filiere === 'IRM') && form.niveau >= 3 && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Spécialité *</label>
          <select
            name="specialite"
            value={form.specialite || ''}
            onChange={(e) => onChange('specialite', e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '2px solid #6c757d', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner la spécialité...</option>
            {getSpecialitesDisponibles(form.filiere, form.niveau).map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Option pour MASI/IRM */}
      {(form.filiere === 'MASI' || form.filiere === 'IRM') && form.niveau == 5 && form.specialite && (
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Option *</label>
          <select
            name="option"
            value={form.option || ''}
            onChange={(e) => onChange('option', e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '2px solid #6c757d', borderRadius: '4px', fontSize: '16px' }}
          >
            <option value="">Sélectionner l'option...</option>
            {getOptionsDisponibles(form.filiere, form.niveau, form.specialite).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Indicateur de parclasse amélioré */}
      {form.filiere && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>📚 Parclasse sélectionné :</h5>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              padding: '8px 15px', 
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {formationData?.nom || form.filiere}
            </span>
            {niveauAffiche && (
              <>
                <span style={{ color: '#6c757d', fontSize: '18px' }}>→</span>
                <span style={{ 
                  backgroundColor: hasNiveauFixe ? '#28a745' : '#6c757d', 
                  color: 'white', 
                  padding: '8px 15px', 
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  Niveau {niveauAffiche}
                  {hasNiveauFixe && <small> (auto)</small>}
                </span>
              </>
            )}
            {form.cycle && (
              <>
                <span style={{ color: '#6c757d', fontSize: '18px' }}>→</span>
                <span style={{ 
                  backgroundColor: '#17a2b8', 
                  color: 'white', 
                  padding: '8px 15px', 
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {form.cycle}
                </span>
              </>
            )}
            {(form.specialiteIngenieur || form.specialiteLicencePro || form.specialiteMasterPro || form.specialite) && (
              <>
                <span style={{ color: '#6c757d', fontSize: '18px' }}>→</span>
                <span style={{ 
                  backgroundColor: '#ffc107', 
                  color: 'black', 
                  padding: '8px 15px', 
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {form.specialiteIngenieur || form.specialiteLicencePro || form.specialiteMasterPro || form.specialite}
                </span>
              </>
            )}
            {(form.optionIngenieur || form.optionLicencePro || form.optionMasterPro || form.option) && (
              <>
                <span style={{ color: '#6c757d', fontSize: '18px' }}>→</span>
                <span style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  padding: '8px 15px', 
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {form.optionIngenieur || form.optionLicencePro || form.optionMasterPro || form.option}
                </span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Statut de validation */}
      {form.filiere && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: hasNiveauFixe ? '#d4edda' : '#fff3cd', borderRadius: '8px' }}>
          <h6 style={{ margin: '0 0 10px 0', color: hasNiveauFixe ? '#155724' : '#856404' }}>
            🔍 Statut de validation :
          </h6>
          <div style={{ fontSize: '14px' }}>
            {hasNiveauFixe ? (
              <span style={{ color: '#155724' }}>
                ✅ Formation avec niveau auto-assigné - Compatible avec le backend
              </span>
            ) : (
              <span style={{ color: '#856404' }}>
                ⚠️ Formation avec niveau manuel - Vérifiez la validation backend
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Debug info amélioré */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h6 style={{ margin: '0 0 10px 0', color: '#495057' }}>🐛 Debug - Données qui seront envoyées au backend :</h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div><strong>filiere:</strong> {form.filiere || 'null'}</div>
          <div><strong>niveau:</strong> {niveauAffiche || 'null'}</div>
          <div><strong>typeFormation:</strong> {form.filiere || 'null'}</div>
          {form.cycle && <div><strong>cycle:</strong> {form.cycle}</div>}
          {form.specialiteIngenieur && <div><strong>specialiteIngenieur:</strong> {form.specialiteIngenieur}</div>}
          {form.optionIngenieur && <div><strong>optionIngenieur:</strong> {form.optionIngenieur}</div>}
          {form.specialiteLicencePro && <div><strong>specialiteLicencePro:</strong> {form.specialiteLicencePro}</div>}
          {form.optionLicencePro && <div><strong>optionLicencePro:</strong> {form.optionLicencePro}</div>}
          {form.specialiteMasterPro && <div><strong>specialiteMasterPro:</strong> {form.specialiteMasterPro}</div>}
          {form.optionMasterPro && <div><strong>optionMasterPro:</strong> {form.optionMasterPro}</div>}
          {form.specialite && <div><strong>specialite:</strong> {form.specialite}</div>}
          {form.option && <div><strong>option:</strong> {form.option}</div>}
        </div>
      </div>
    </div>
  );
};

// Composant de test principal
const FormationSelectorTest = () => {
  const [form, setForm] = useState({
    filiere: '',
    niveau: '',
    cycle: '',
    specialiteIngenieur: '',
    optionIngenieur: '',
    specialiteLicencePro: '',
    optionLicencePro: '',
    specialiteMasterPro: '',
    optionMasterPro: '',
    specialite: '',
    option: ''
  });

  const handleChange = (field, value) => {
    const newForm = { ...form };
    
    if (field === 'filiere') {
      newForm.filiere = value;
      
      // Réinitialiser tous les champs spécifiques
      newForm.cycle = '';
      newForm.specialiteIngenieur = '';
      newForm.optionIngenieur = '';
      newForm.specialiteLicencePro = '';
      newForm.optionLicencePro = '';
      newForm.specialiteMasterPro = '';
      newForm.optionMasterPro = '';
      newForm.specialite = '';
      newForm.option = '';
      
      // Gestion du niveau selon le type de formation
      const formationData = STRUCTURE_FORMATION[value];
      if (formationData && !formationData.niveauxManuels) {
        // Auto-assignation du niveau pour LICENCE_PRO et MASTER_PRO
        newForm.niveau = formationData.niveauFixe;
      } else {
        // Réinitialiser le niveau pour les formations à niveau manuel
        newForm.niveau = '';
      }
      
      // Configurer le cycle pour École d'Ingénieur
      if (value === 'CYCLE_INGENIEUR' && newForm.niveau) {
        newForm.cycle = getCycleParNiveau(newForm.niveau);
      }
      
    } else if (field === 'niveau') {
      newForm.niveau = value;
      
      // Mise à jour du cycle pour École d'Ingénieur
      if (newForm.filiere === 'CYCLE_INGENIEUR') {
        const nouveauCycle = getCycleParNiveau(value);
        newForm.cycle = nouveauCycle;