import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Mail, 
  BookOpen, 
  Users, 
  CreditCard, 
  BarChart3, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

const handleLogin = async () => {
  if (!email || !motDePasse) {
    setMessage('error|Veuillez remplir tous les champs');
    return;
  }

  setIsLoading(true);
  setMessage('');

  try {
    const res = await fetch('http://195.179.229.230:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, motDePasse })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // Note: In a real implementation, avoid localStorage for sensitive data
      // This is kept for compatibility with the existing system
      if (typeof(Storage) !== "undefined") {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setMessage('success|Connexion réussie ! Redirection en cours...');

setTimeout(() => {
  if (data.role === 'admin') {
    window.location.href = '/admin/dashboard';
  } else if (data.role === 'administratif') { // 🆕 NOUVEAU - Administratif
    window.location.href = '/administratif';
  } else if (data.role === 'prof') {
    window.location.href = '/professeur';
  } else if (data.role === 'etudiant') {
    window.location.href = '/etudiant';
  } else if (data.role === 'commercial') {
    window.location.href = '/commercial';
  } else if (data.role === 'paiement_manager') {
    window.location.href = '/paiement-manager';
  } else if (data.role === 'pedagogique') {
    window.location.href = '/pedagogique';
  } else {
    setMessage('error|Rôle utilisateur inconnu: ' + data.role);
  }
}, 1500);
    } else {
      setMessage('error|' + (data.message || 'Email ou mot de passe incorrect'));
    }
  } catch (err) {
    console.error('Erreur de connexion:', err);
    setMessage('error|Impossible de se connecter au serveur. Vérifiez votre connexion.');
  } finally {
    setIsLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const messageType = message.split('|')[0];
  const messageText = message.split('|')[1];

  return (
    <>
      <style>
        {`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

     .login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow: hidden;
}

        .background-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%);
          animation: float 8s ease-in-out infinite;
        }

 .main-card {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

 @media (max-width: 1024px) {
  .left-panel {
    display: none !important;
  }

  .main-card {
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }

  .right-panel {
    width: 100%;
    height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

        .left-panel {
          flex: 1;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          padding: 40px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }

        .left-panel-overlay {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%);
        }

        .left-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3Ccircle cx='53' cy='7' r='7'/%3E%3Ccircle cx='7' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.4;
        }

        .brand-section {
          position: relative;
          z-index: 2;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .brand-logo {
          width: 140px;
          height: 140px;
          margin: 0 auto 30px;
          background:white;
          border-radius: 28px;
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .brand-logo:hover {
          transform: translateY(-5px);
        }

        .brand-logo img {
          width: 90px;
          height: 90px;
          object-fit: contain;
          filter: brightness(1.2) contrast(1.1);
        }

        .brand-title {
          font-size: 42px;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.03em;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
          background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-subtitle {
          font-size: 18px;
          opacity: 0.9;
          font-weight: 400;
          margin-bottom: 40px;
          letter-spacing: 0.5px;
          text-shadow: 0 1px 10px rgba(0, 0, 0, 0.1);
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 40px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 14px;
          font-weight: 500;
        }

        .feature-icon {
          color: #a8d5ff;
        }

        .back-button {
          position: absolute;
          top: 30px;
          left: 30px;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          padding: 12px 16px;
          border-radius: 14px;
          cursor: pointer;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          z-index: 10;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
        }

        .right-panel {
          flex: 1;
          padding: 60px 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: white;
          box-shadow: 0 8px 20px rgba(30, 60, 114, 0.3);
        }

        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .login-subtitle {
          font-size: 16px;
          color: #6b7280;
        }

        .input-group {
          margin-bottom: 24px;
        }

        .label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
        }

        .input {
          width: 100%;
          padding: 16px 48px 16px 48px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          background: #f9fafb;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-sizing: border-box;
        }

        .input:focus {
          border-color: #2a5298;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(42, 82, 152, 0.1);
          transform: translateY(-1px);
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          transition: color 0.3s ease;
        }

        .input:focus + .input-icon {
          color: #2a5298;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .password-toggle:hover {
          color: #2a5298;
          background: #f3f4f6;
        }

        .login-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          box-shadow: 0 4px 15px rgba(30, 60, 114, 0.3);
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(30, 60, 114, 0.4);
          background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .message {
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          margin-top: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message-success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .message-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .footer {
          text-align: center;
          margin-top: 32px;
          color: #9ca3af;
          font-size: 14px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        /* Media Queries pour la responsivité */
        @media (max-width: 1024px) {
          .main-card {
            max-width: 900px;
            margin: 10px;
          }
          .left-panel {
            padding: 40px 30px;
          }
          .right-panel {
            padding: 40px 30px;
          }
          .brand-title {
            font-size: 28px;
          }
          .back-button {
            top: 20px;
            left: 20px;
            padding: 10px;
            font-size: 12px;
          }
        }

        @media (max-width: 768px) {
          .login-container {
            padding: 10px;
            align-items: flex-start;
            padding-top: 20px;
          }
          .main-card {
            flex-direction: column;
            max-width: 100%;
            min-height: auto;
            border-radius: 16px;
          }
          .left-panel {
            padding: 30px 20px;
            min-height: 200px;
            text-align: center;
          }
          .brand-section {
            margin-bottom: 30px;
          }
          .brand-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 16px;
          }
          .brand-logo img {
            width: 60px;
            height: 60px;
          }
          .brand-title {
            font-size: 24px;
            margin-bottom: 8px;
          }
          .back-button {
            top: 15px;
            left: 15px;
            padding: 8px;
            font-size: 12px;
          }
          .right-panel {
            padding: 30px 20px;
          }
          .login-header {
            margin-bottom: 30px;
          }
          .login-icon {
            width: 56px;
            height: 56px;
          }
          .login-title {
            font-size: 22px;
          }
          .login-subtitle {
            font-size: 14px;
          }
          .input-group {
            margin-bottom: 20px;
          }
          .input {
            padding: 14px 40px 14px 40px;
            font-size: 16px;
          }
          .footer {
            font-size: 12px;
            margin-top: 20px;
          }
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 5px;
          }
          .left-panel {
            padding: 20px 15px;
          }
          .right-panel {
            padding: 20px 15px;
          }
          .brand-title {
            font-size: 20px;
          }
          .back-button {
            top: 10px;
            left: 10px;
            padding: 6px;
            font-size: 11px;
          }
          .login-title {
            font-size: 18px;
          }
          .input {
            padding: 12px 36px 12px 36px;
            font-size: 14px;
          }
          .input-icon {
            left: 12px;
          }
          .password-toggle {
            right: 12px;
          }
          .login-button {
            padding: 14px;
            font-size: 14px;
          }
        }

        @media (max-width: 360px) {
          .brand-logo {
            width: 60px;
            height: 60px;
          }
          .brand-logo img {
            width: 45px;
            height: 45px;
          }
          .login-icon {
            width: 48px;
            height: 48px;
          }
          .input {
            padding: 10px 32px 10px 32px;
          }
        }

        /* Orientation paysage pour tablettes */
        @media (max-width: 1024px) and (orientation: landscape) {
          .left-panel {
            padding: 20px;
          }
          .brand-section {
            margin-bottom: 20px;
          }
        }
      `}</style>
      
      <div className="login-container">
        <div className="background-pattern"></div>
        
        <div className="main-card">
          {/* Panneau gauche - Branding */}
          <div className="left-panel">
            <div className="left-panel-overlay"></div>
            
          
            
            <div className="brand-section">
              <div className="brand-logo">
                <img src="/download__9_-removebg-preview.png" alt="Supemir Logo" />
              </div>
             
              <div className="brand-features">
                <div className="feature-item">
                  <BookOpen size={18} className="feature-icon" />
                  <span>Cours interactifs</span>
                </div>
                <div className="feature-item">
                  <Users size={18} className="feature-icon" />
                  <span>Communauté d'apprenants</span>
                </div>
                <div className="feature-item">
                  <BarChart3 size={18} className="feature-icon" />
                  <span>Suivi des performances</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panneau droit - Connexion */}
          <div className="right-panel">
            <div className="login-header">
              <div className="login-icon">
                <User size={32} />
              </div>
              <h2 className="login-title">Connexion</h2>
              <p className="login-subtitle">
                Accédez à votre tableau de bord
              </p>
            </div>

            <div>
              <div className="input-group">
                <label className="label">Adresse Email</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    onKeyPress={handleKeyPress}
                    className="input"
                    required
                  />
                  <Mail size={20} className="input-icon" />
                </div>
              </div>

              <div className="input-group">
                <label className="label">Mot de Passe</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Saisissez votre mot de passe"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    onKeyPress={handleKeyPress}
                    className="input"
                    required
                  />
                  <Lock size={20} className="input-icon" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="login-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <User size={20} />
                    Se Connecter
                  </>
                )}
              </button>

              {messageText && (
                <div className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>
                  {messageType === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  {messageText}
                </div>
              )}
            </div>

            <div className="footer">
              © 2025 ABDO Pro - Tous droits réservés
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;