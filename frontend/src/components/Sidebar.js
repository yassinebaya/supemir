import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  GraduationCap,
  Wallet,
  Clock,
   Briefcase,
  Users,
  BookOpen,
  CreditCard,
  Plus,
   BarChart3,
  Calendar,
  ClipboardList,
  LogOut,
  Menu,
  X,
   MessageCircle,
  Home,
  FileText,
  User,
  Shield,
  QrCode,
      Newspaper

  
} from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Sur desktop, ouvrir par défaut
      if (!mobile) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      closeSidebar();
    }
  };

  const navigationItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: Home
    },
    {
      path: '/update-profil',
      label: 'profil',
      icon:  Shield,

    }, {
      path: '/liste-classes',
      label: 'Classes',
      icon: BookOpen
    },
    {
      path: '/liste-etudiants',
      label: 'Étudiants',
      icon: Users
    },
    {
      path: '/liste-professeurs',
      label: 'Professeurs',
      icon: User
    },
 
    {
      path: '/ajouter-paiement',
      label: 'Nouveau Paiement',
      icon: Plus
    },

    {
      path: '/liste-paiements',
      label: 'Paiements',
      icon: CreditCard
    },
   
        {
      path: '/admin/seances',
      label: 'Séances',
      icon:  Clock
    },
   
  
    {
      path: '/calendrier',
      label: 'Calendrier',
      icon: Calendar
    },
    {
      path: '/liste-presences',
      label: 'Liste présences',
      icon: ClipboardList
    } ,
  

    
    {
      path: '/admin/commercial',
      label: 'commercial',
      icon: Briefcase
    },
     {
      path: '/admin/StatistiquesEtudiants',
      label: 'Statistiques',
      icon: BarChart3
    }
,
     {
      path: '/admin/Bulletin',
      label: 'Bulletin',
      icon: FileText
    }
,
     {
      path: '/admin/PaiementManager',
      label: 'Manager',
      icon: Wallet
    }




  ];

  // Utiliser location.pathname au lieu d'un state local
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    closeSidebar();
  };

  return (
    <div>
      <style jsx>{`
        /* Variables CSS */
        :root {
          --sidebar-width: 280px;
          --sidebar-bg: #ffffff;
          --sidebar-border: #e5e7eb;
          --sidebar-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          --primary-color: #4f46e5;
          --primary-hover: #4338ca;
          --primary-light: #eef2ff;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --text-muted: #9ca3af;
          --hover-bg: #f9fafb;
          --active-bg: #eef2ff;
          --border-radius: 12px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --header-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          --logout-color: #dc2626;
          --logout-hover: #b91c1c;
          --logout-bg: #fef2f2;
        }

        /* Reset and base styles */
        * {
          box-sizing: border-box;
        }

        /* Toggle Button - Positionné en dehors de la sidebar */
        .sidebar-toggle {
          position: fixed;
          top: 20px;
          left: ${isOpen ? 'calc(var(--sidebar-width) + 20px)' : '20px'};
          z-index: 1001;
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 12px;
          border-radius: var(--border-radius);
          box-shadow: var(--sidebar-shadow);
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
        }

        /* Sur mobile, le bouton reste à gauche */
        @media (max-width: 768px) {
          .sidebar-toggle {
            left: 20px !important;
          }
        }

        .sidebar-toggle:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Overlay pour mobile */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 998;
          opacity: 0;
          visibility: hidden;
          transition: var(--transition);
        }

        .sidebar-overlay.show {
          opacity: 1;
          visibility: visible;
        }

        /* Sidebar principal */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          box-shadow: var(--sidebar-shadow);
          z-index: 999;
          display: flex;
          flex-direction: column;
          transition: var(--transition);
          overflow: hidden;
          transform: translateX(-100%);
        }

        .sidebar.show {
          transform: translateX(0);
        }

        /* Header de la sidebar */
        .sidebar-header {
          padding: 24px 20px;
          background: var(--header-gradient);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .sidebar-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          transform: translate(50%, 50%);
        }

        .sidebar-header::after {
          content: '';
          position: absolute;
          bottom: -25%;
          left: -25%;
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .sidebar-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .sidebar-title .header-icon {
          width: 32px;
          height: 32px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          padding: 20px 16px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--sidebar-border) transparent;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: var(--sidebar-border);
          border-radius: 2px;
        }

        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Items de navigation */
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          border-radius: 12px;
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
          font-family: inherit;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--primary-color);
          transform: scaleY(0);
          transition: var(--transition);
          border-radius: 0 4px 4px 0;
        }

        .nav-item:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
          transform: translateX(4px);
        }

        .nav-item:hover::before {
          transform: scaleY(0.6);
        }

        .nav-item:hover .nav-icon-wrapper {
          background: #e5e7eb;
          transform: scale(1.05);
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.1);
        }

        .nav-item.active {
          background: var(--active-bg);
          color: var(--primary-color);
          font-weight: 600;
          border-right: 4px solid var(--primary-color);
        }

        .nav-item.active::before {
          transform: scaleY(1);
        }

        .nav-item.active .nav-icon-wrapper {
          background: #c7d2fe;
        }

        .nav-item.active .nav-icon {
          color: var(--primary-color);
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: var(--primary-color);
          border-radius: 50%;
        }

        .nav-icon-wrapper {
          width: 32px;
          height: 32px;
          background: #f3f4f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          flex-shrink: 0;
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          transition: var(--transition);
        }

        /* Section déconnexion */
        .logout-section {
          padding: 16px;
          border-top: 1px solid var(--sidebar-border);
          background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.02));
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          color: var(--logout-color);
          font-size: 14px;
          font-weight: 500;
          border-radius: 12px;
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          font-family: inherit;
        }

        .logout-btn:hover {
          background: var(--logout-bg);
          transform: translateY(-1px);
        }

        .logout-btn:hover .logout-icon-wrapper {
          background: #fecaca;
          transform: scale(1.05);
        }

        .logout-btn:hover .logout-icon {
          transform: scale(1.1) rotate(-5deg);
        }

        .logout-icon-wrapper {
          width: 32px;
          height: 32px;
          background: #fee2e2;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          flex-shrink: 0;
        }

        .logout-icon {
          width: 18px;
          height: 18px;
          transition: var(--transition);
        }

        /* Responsive Design */
        @media (min-width: 769px) {
          .sidebar.show {
            transform: translateX(0);
          }
          
          .sidebar-overlay {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .sidebar-overlay.show {
            display: block;
          }
        }

        /* États de focus pour l'accessibilité */
        .nav-item:focus,
        .logout-btn:focus,
        .sidebar-toggle:focus {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        /* Animations d'entrée */
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .sidebar.show {
          animation: slideInLeft 0.3s ease-out;
        }

        .sidebar-overlay.show {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      {/* Toggle Button - Maintenant positionné en dehors de la sidebar */}
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        title={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">
            <div className="header-icon">
              <GraduationCap size={20} />
            </div>
   Supemir
          </h3>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <div className="nav-icon-wrapper">
                    <IconComponent className="nav-icon" />
                  </div>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="logout-section">
          <button onClick={handleLogout} className="logout-btn">
            <div className="logout-icon-wrapper">
              <LogOut className="logout-icon" />
            </div>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;