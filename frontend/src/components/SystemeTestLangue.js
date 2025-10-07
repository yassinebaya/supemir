import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, ChevronRight } from 'lucide-react';

// Styles CSS
const styles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 28rem;
    width: 100%;
    margin: 1rem;
    padding: 1.5rem;
  }

  .modal-icon {
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3rem;
    width: 3rem;
    border-radius: 50%;
    background-color: #dbeafe;
    margin-bottom: 1rem;
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .modal-text {
    color: #4b5563;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .info-box {
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .info-box h3 {
    font-weight: 600;
    color: #1e3a8a;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }

  .info-box ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .info-box li {
    color: #1e40af;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .btn-primary {
    width: 100%;
    background-color: #2563eb;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
  }

  .page-container {
    min-height: 100vh;
    background-color: #f9fafb;
    padding: 2rem 1rem;
  }

  .page-wrapper {
    max-width: 64rem;
    margin: 0 auto;
  }

  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .page-title {
    font-size: 1.875rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .page-subtitle {
    color: #4b5563;
    margin-bottom: 2rem;
  }

  .progress-container {
    margin-bottom: 2rem;
  }

  .progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .progress-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .progress-bar-bg {
    width: 100%;
    background-color: #e5e7eb;
    border-radius: 9999px;
    height: 0.5rem;
    overflow: hidden;
  }

  .progress-bar {
    background-color: #2563eb;
    height: 100%;
    border-radius: 9999px;
    transition: width 0.3s;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .test-card {
    border: 2px solid #d1d5db;
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.2s;
  }

  .test-card:not(.completed):hover {
    border-color: #60a5fa;
  }

  .test-card.completed {
    border-color: #86efac;
    background-color: #f0fdf4;
  }

  .test-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .test-card-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .test-card-info {
    font-size: 0.875rem;
    color: #4b5563;
  }

  .result-box {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid #86efac;
    text-align: center;
  }

  .result-label {
    font-size: 0.875rem;
    color: #4b5563;
    margin-bottom: 0.25rem;
  }

  .result-level {
    font-size: 1.5rem;
    font-weight: bold;
    color: #16a34a;
  }

  .btn-start {
    width: 100%;
    background-color: #2563eb;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }

  .btn-start:hover {
    background-color: #1d4ed8;
  }

  .success-box {
    margin-top: 2rem;
    background-color: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
  }

  .success-icon {
    height: 3rem;
    width: 3rem;
    color: #16a34a;
    margin: 0 auto 0.75rem;
  }

  .success-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #14532d;
    margin-bottom: 0.5rem;
  }

  .success-text {
    color: #166534;
    margin-bottom: 1rem;
  }

  .btn-success {
    background-color: #16a34a;
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-success:hover {
    background-color: #15803d;
  }

  .test-header {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .test-header-title {
    font-size: 1.125rem;
    font-weight: bold;
    color: #111827;
  }

  .test-header-subtitle {
    font-size: 0.875rem;
    color: #4b5563;
  }

  .timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
  }

  .timer.warning {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .timer.normal {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .timer-text {
    font-family: monospace;
    font-size: 1.125rem;
    font-weight: bold;
  }

  .question-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .step-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background-color: #dbeafe;
    color: #1e40af;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .question-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 1.5rem;
  }

  .options-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .option-button {
    width: 100%;
    text-align: left;
    padding: 1rem;
    border-radius: 8px;
    border: 2px solid #d1d5db;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .option-button:hover:not(:disabled) {
    border-color: #60a5fa;
    background-color: #f9fafb;
  }

  .option-button.selected {
    border-color: #2563eb;
    background-color: #eff6ff;
  }

  .option-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .radio {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .radio.selected {
    border-color: #2563eb;
    background-color: #2563eb;
  }

  .radio-inner {
    width: 0.75rem;
    height: 0.75rem;
    background: white;
    border-radius: 50%;
  }

  .option-text {
    color: #111827;
  }

  .nav-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn-nav {
    padding: 0.5rem 1.5rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-nav:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  .btn-nav:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-finish {
    padding: 0.5rem 1.5rem;
    background-color: #16a34a;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .btn-finish:hover:not(:disabled) {
    background-color: #15803d;
  }

  .btn-finish:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modal-warning-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal-warning-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 28rem;
    width: 100%;
    margin: 1rem;
    padding: 1.5rem;
  }

  .modal-warning-icon {
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3rem;
    width: 3rem;
    border-radius: 50%;
    background-color: #fee2e2;
    margin-bottom: 1rem;
  }

  .modal-warning-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .modal-warning-text {
    color: #4b5563;
    margin-bottom: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
  }

  .modal-warning-list {
    background-color: #fef3c7;
    border: 1px solid #fde047;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .modal-warning-list-title {
    font-weight: 600;
    color: #854d0e;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .modal-warning-question {
    color: #92400e;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .modal-warning-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .btn-modal-secondary {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .btn-modal-secondary:hover {
    background-color: #f9fafb;
  }

  .btn-modal-primary {
    flex: 1;
    padding: 0.75rem 1rem;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .btn-modal-primary:hover {
    background-color: #1d4ed8;
  }

  .btn-next {
    padding: 0.5rem 1.5rem;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .btn-next:hover:not(:disabled) {
    background-color: #1d4ed8;
  }

  .result-container {
    max-width: 42rem;
    margin: 0 auto;
  }

  .result-icon-container {
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 4rem;
    width: 4rem;
    border-radius: 50%;
    background-color: #dcfce7;
    margin-bottom: 1rem;
  }

  .result-title {
    font-size: 1.875rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .result-subtitle {
    color: #4b5563;
    margin-bottom: 2rem;
    text-align: center;
  }

  .level-display {
    background: linear-gradient(to right, #eff6ff, #eef2ff);
    border-radius: 8px;
    padding: 2rem;
    margin-bottom: 2rem;
    text-align: center;
  }

  .level-label {
    font-size: 0.875rem;
    color: #4b5563;
    margin-bottom: 0.5rem;
  }

  .level-value {
    font-size: 3rem;
    font-weight: bold;
    color: #2563eb;
    margin-bottom: 1rem;
  }

  .level-description {
    color: #374151;
  }

  .warning-box {
    background-color: #fef3c7;
    border: 1px solid #fde047;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .warning-text {
    font-size: 0.875rem;
    color: #854d0e;
  }

  .loading-container {
    min-height: 100vh;
    background-color: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-content {
    text-align: center;
  }

  .spinner {
    animation: spin 1s linear infinite;
    border-radius: 50%;
    height: 3rem;
    width: 3rem;
    border: 2px solid #e5e7eb;
    border-top-color: #2563eb;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    color: #4b5563;
  }
`;

// ===== COMPOSANT MODAL OBLIGATOIRE =====
const ModalTestObligatoire = ({ onCommencer, etudiantNom }) => {
  return (
    <>
      <style>{styles}</style>
      <div className="modal-overlay">
        <div className="modal-content">
          <div style={{ textAlign: 'center' }}>
            <div className="modal-icon">
              <AlertCircle style={{ height: '1.5rem', width: '1.5rem', color: '#2563eb' }} />
            </div>
            <h2 className="modal-title">
              Bienvenue {etudiantNom} !
            </h2>
            <p className="modal-text">
              Avant d'accéder à votre dashboard, vous devez passer les tests de positionnement en langues.
            </p>
            <div className="info-box">
              <h3>Tests requis :</h3>
              <ul>
                <li>✓ Test d'anglais (20 minutes)</li>
                <li>✓ Test de français (20 minutes)</li>
              </ul>
            </div>
            <button onClick={onCommencer} className="btn-primary">
              Commencer les tests
              <ArrowRight style={{ height: '1.25rem', width: '1.25rem' }} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ===== PAGE DE SÉLECTION DES TESTS =====
const PageSelectionTest = ({ statutTests, onDemarrerTest }) => {
  return (
    <>
      <style>{styles}</style>
      <div className="page-container">
        <div className="page-wrapper">
          <div className="card">
            <h1 className="page-title">
              Tests de Positionnement en Langues
            </h1>
            <p className="page-subtitle">
              Complétez les deux tests pour accéder à votre dashboard étudiant
            </p>

            <div className="progress-container">
              <div className="progress-header">
                <span className="progress-label">Progression</span>
                <span className="progress-label">
                  {statutTests.anglaisTermine && statutTests.francaisTermine ? '2/2' : 
                   statutTests.anglaisTermine || statutTests.francaisTermine ? '1/2' : '0/2'}
                </span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${(statutTests.anglaisTermine ? 50 : 0) + (statutTests.francaisTermine ? 50 : 0)}%` 
                  }}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className={`test-card ${statutTests.anglaisTermine ? 'completed' : ''}`}>
                <div className="test-card-header">
                  <div>
                    <h3 className="test-card-title">Test d'Anglais</h3>
                    <p className="test-card-info">60 questions • 20 minutes</p>
                  </div>
                  {statutTests.anglaisTermine ? (
                    <CheckCircle style={{ height: '2rem', width: '2rem', color: '#16a34a' }} />
                  ) : (
                    <Clock style={{ height: '2rem', width: '2rem', color: '#9ca3af' }} />
                  )}
                </div>

                {statutTests.anglaisTermine ? (
                  <div className="result-box">
                    <p className="result-label">Niveau obtenu</p>
                    <p className="result-level">{statutTests.niveaux.anglais}</p>
                  </div>
                ) : (
                  <button onClick={() => onDemarrerTest('anglais')} className="btn-start">
                    Démarrer le test
                    <ChevronRight style={{ height: '1.25rem', width: '1.25rem' }} />
                  </button>
                )}
              </div>

              <div className={`test-card ${statutTests.francaisTermine ? 'completed' : ''}`}>
                <div className="test-card-header">
                  <div>
                    <h3 className="test-card-title">Test de Français</h3>
                    <p className="test-card-info">26 questions • 20 minutes</p>
                  </div>
                  {statutTests.francaisTermine ? (
                    <CheckCircle style={{ height: '2rem', width: '2rem', color: '#16a34a' }} />
                  ) : (
                    <Clock style={{ height: '2rem', width: '2rem', color: '#9ca3af' }} />
                  )}
                </div>

                {statutTests.francaisTermine ? (
                  <div className="result-box">
                    <p className="result-label">Niveau obtenu</p>
                    <p className="result-level">{statutTests.niveaux.francais}</p>
                  </div>
                ) : (
                  <button onClick={() => onDemarrerTest('francais')} className="btn-start">
                    Démarrer le test
                    <ChevronRight style={{ height: '1.25rem', width: '1.25rem' }} />
                  </button>
                )}
              </div>
            </div>

            {statutTests.tousTermines && (
              <div className="success-box">
                <CheckCircle className="success-icon" />
                <h3 className="success-title">Félicitations !</h3>
                <p className="success-text">
                  Vous avez terminé tous les tests. Vous pouvez maintenant accéder à votre dashboard.
                </p>
                <button onClick={() => window.location.reload()} className="btn-success">
                  Accéder au dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ===== MODAL D'AVERTISSEMENT =====
const ModalQuestionsNonRepondues = ({ questionsNonRepondues, onFermer }) => {
  return (
    <>
      <style>{styles}</style>
      <div className="modal-warning-overlay" onClick={onFermer}>
        <div className="modal-warning-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-warning-icon">
            <AlertCircle style={{ height: '1.5rem', width: '1.5rem', color: '#dc2626' }} />
          </div>
          <h3 className="modal-warning-title">Impossible de terminer</h3>
          <p className="modal-warning-text">
            Vous devez répondre à toutes les questions avant de terminer le test.
            Il vous reste {questionsNonRepondues.length} question{questionsNonRepondues.length > 1 ? 's' : ''} à compléter.
          </p>
          <div className="modal-warning-list">
            <p className="modal-warning-list-title">Questions non répondues :</p>
            {questionsNonRepondues.slice(0, 5).map((q, index) => (
              <p key={index} className="modal-warning-question">
                • Question {q.numero} ({q.step})
              </p>
            ))}
            {questionsNonRepondues.length > 5 && (
              <p className="modal-warning-question">
                ... et {questionsNonRepondues.length - 5} autre{questionsNonRepondues.length - 5 > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="modal-warning-buttons">
            <button onClick={onFermer} className="btn-modal-primary" style={{ flex: 'none', width: '100%' }}>
              Compléter les questions manquantes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ===== COMPOSANT TEST =====
const ComposantTest = ({ langue, questions, testId, onTerminer }) => {
  const [questionActuelle, setQuestionActuelle] = useState(0);
  const [reponses, setReponses] = useState({});
  const [tempsRestant, setTempsRestant] = useState(20 * 60);
  const [chargement, setChargement] = useState(false);
  const [afficherModalAvertissement, setAfficherModalAvertissement] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTempsRestant(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          terminerTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTemps = (secondes) => {
    const mins = Math.floor(secondes / 60);
    const secs = secondes % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sauvegarderReponse = async (questionId, reponseIndex) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://195.179.229.230:5000/api/tests/${testId}/reponse`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questionId, reponseIndex })
      });
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const handleReponse = async (optionIndex) => {
    const question = questions[questionActuelle];
    const nouvellesReponses = { ...reponses, [question.id]: optionIndex };
    setReponses(nouvellesReponses);

    await sauvegarderReponse(question.id, optionIndex);

    setTimeout(() => {
      if (questionActuelle < questions.length - 1) {
        setQuestionActuelle(questionActuelle + 1);
      }
    }, 300);
  };

  const terminerTest = async () => {
    setChargement(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://195.179.229.230:5000/api/tests/${testId}/terminer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // Debug: Afficher les données reçues du backend
      console.log('Données reçues du backend:', data);
      console.log('Score:', data.resultat?.score);
      console.log('Total questions:', data.resultat?.totalQuestions);
      
      onTerminer(data.resultat);
    } catch (error) {
      console.error('Erreur terminaison:', error);
      alert('Erreur lors de la terminaison du test');
    }
    setChargement(false);
  };

  const verifierEtTerminer = () => {
    // Vérifier si toutes les questions ont été répondues
    const questionsNonRepondues = questions
      .map((q, index) => ({ ...q, numero: index + 1 }))
      .filter(q => reponses[q.id] === undefined);

    if (questionsNonRepondues.length > 0) {
      setAfficherModalAvertissement(true);
    } else {
      terminerTest();
    }
  };

  const handleFermerModal = () => {
    setAfficherModalAvertissement(false);
  };

  const getQuestionsNonRepondues = () => {
    return questions
      .map((q, index) => ({ ...q, numero: index + 1 }))
      .filter(q => reponses[q.id] === undefined);
  };

  const question = questions[questionActuelle];
  const progression = ((questionActuelle + 1) / questions.length) * 100;

  return (
    <>
      <style>{styles}</style>
      <div className="page-container">
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <div className="test-header">
            <div>
              <h2 className="test-header-title">
                Test de {langue === 'anglais' ? 'Anglais' : 'Français'}
              </h2>
              <p className="test-header-subtitle">
                Question {questionActuelle + 1} sur {questions.length}
              </p>
            </div>
            <div className={`timer ${tempsRestant < 300 ? 'warning' : 'normal'}`}>
              <Clock style={{ height: '1.25rem', width: '1.25rem' }} />
              <span className="timer-text">{formatTemps(tempsRestant)}</span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="progress-bar-bg">
              <div className="progress-bar" style={{ width: `${progression}%` }} />
            </div>
          </div>

          <div className="question-card">
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="step-badge">{question.step}</span>
              <h3 className="question-text">{question.question}</h3>
            </div>

            <div className="options-container">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleReponse(index)}
                  disabled={chargement}
                  className={`option-button ${reponses[question.id] === index ? 'selected' : ''}`}
                >
                  <div className="option-content">
                    <div className={`radio ${reponses[question.id] === index ? 'selected' : ''}`}>
                      {reponses[question.id] === index && <div className="radio-inner" />}
                    </div>
                    <span className="option-text">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="nav-buttons">
              <button
                onClick={() => setQuestionActuelle(Math.max(0, questionActuelle - 1))}
                disabled={questionActuelle === 0 || chargement}
                className="btn-nav"
              >
                Précédent
              </button>

              {questionActuelle === questions.length - 1 ? (
                <button
                  onClick={verifierEtTerminer}
                  disabled={chargement}
                  className="btn-finish"
                >
                  {chargement ? 'Traitement...' : 'Terminer le test'}
                  {!chargement && <CheckCircle style={{ height: '1.25rem', width: '1.25rem' }} />}
                </button>
              ) : (
                <button
                  onClick={() => setQuestionActuelle(questionActuelle + 1)}
                  disabled={chargement}
                  className="btn-next"
                >
                  Suivant
                </button>
              )}
            </div>
          </div>

          {afficherModalAvertissement && (
            <ModalQuestionsNonRepondues
              questionsNonRepondues={getQuestionsNonRepondues()}
              onFermer={handleFermerModal}
            />
          )}
        </div>
      </div>
    </>
  );
};

// ===== PAGE DE RÉSULTAT =====
const PageResultat = ({ resultat, langue, onRetour }) => {
  return (
    <>
      <style>{styles}</style>
      <div className="page-container">
        <div className="result-container">
          <div className="card">
            <div style={{ textAlign: 'center' }}>
              <div className="result-icon-container">
                <CheckCircle style={{ height: '2.5rem', width: '2.5rem', color: '#16a34a' }} />
              </div>
              
              <h2 className="result-title">Test terminé !</h2>
              <p className="result-subtitle">
                Test de {langue === 'anglais' ? 'Anglais' : 'Français'}
              </p>

              <div className="level-display">
                <p className="level-label">Votre niveau</p>
                <p className="level-value">{resultat.niveau}</p>
                <p className="level-description">
                  Vous avez répondu correctement à {resultat.score} questions sur {resultat.totalQuestions}
                </p>
              </div>

              {resultat.premiereErreur && resultat.premiereErreur.questionId && (
                <div className="warning-box">
                  <p className="warning-text">
                    Première erreur détectée au niveau <strong>{resultat.premiereErreur.step}</strong> 
                    (Question #{resultat.premiereErreur.questionId})
                  </p>
                </div>
              )}

              <button onClick={onRetour} className="btn-primary">
                Retour aux tests
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ===== COMPOSANT PRINCIPAL =====
export default function SystemeTestLangue({ etudiant }) {
  const [vue, setVue] = useState('chargement');
  const [statutTests, setStatutTests] = useState(null);
  const [testEnCours, setTestEnCours] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [resultat, setResultat] = useState(null);
  const [langueEnCours, setLangueEnCours] = useState(null);

  useEffect(() => {
    chargerStatutTests();
  }, []);

  const chargerStatutTests = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://195.179.229.230:5000/api/tests/statut', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setStatutTests(data);

      if (!data.nouvelleInscription || data.tousTermines) {
        setVue('termine');
      } else {
        setVue('modal');
      }
    } catch (error) {
      console.error('Erreur chargement statut:', error);
      setVue('erreur');
    }
  };

  const handleCommencerTests = () => {
    setVue('selection');
  };

  const handleDemarrerTest = async (langue) => {
    try {
      const token = localStorage.getItem('token');
      
      const responseTest = await fetch('http://195.179.229.230:5000/api/tests/demarrer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ langue })
      });
      const dataTest = await responseTest.json();
      setTestEnCours(dataTest.test);

      const responseQuestions = await fetch(`http://195.179.229.230:5000/api/tests/questions/${langue}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const dataQuestions = await responseQuestions.json();
      setQuestions(dataQuestions.questions);

      setLangueEnCours(langue);
      setVue('test');
    } catch (error) {
      console.error('Erreur démarrage test:', error);
      alert('Erreur lors du démarrage du test');
    }
  };

  const handleTerminerTest = (resultatTest) => {
    setResultat(resultatTest);
    setVue('resultat');
  };

  const handleRetourSelection = async () => {
    await chargerStatutTests();
    setVue('selection');
    setTestEnCours(null);
    setQuestions([]);
    setResultat(null);
    setLangueEnCours(null);
  };

  if (vue === 'chargement') {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Chargement...</p>
          </div>
        </div>
      </>
    );
  }

  if (vue === 'termine' || vue === 'erreur') {
    return null;
  }

  if (vue === 'modal') {
    return (
      <ModalTestObligatoire 
        onCommencer={handleCommencerTests}
        etudiantNom={etudiant?.prenom || 'Étudiant'}
      />
    );
  }

  if (vue === 'selection') {
    return (
      <PageSelectionTest 
        statutTests={statutTests}
        onDemarrerTest={handleDemarrerTest}
      />
    );
  }

  if (vue === 'test' && testEnCours && questions.length > 0) {
    return (
      <ComposantTest 
        langue={langueEnCours}
        questions={questions}
        testId={testEnCours._id}
        onTerminer={handleTerminerTest}
      />
    );
  }

  if (vue === 'resultat' && resultat) {
    return (
      <PageResultat 
        resultat={resultat}
        langue={langueEnCours}
        onRetour={handleRetourSelection}
      />
    );
  }

  return null;
}