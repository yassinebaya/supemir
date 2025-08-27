import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Download } from 'lucide-react';

// Import des pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ListeEtudiants from './pages/ListeEtudiants';
import ListeCours from './pages/ListeCours';
import AjouterPaiement from './pages/AjouterPaiement';
import ListePaiements from './pages/ListePaiements';
import Calendrier from './pages/Calendrier';
import ProfilEtudiant from './pages/ProfilEtudiant';
import AjouterPresence from './pages/AjouterPresence';
import ListePresences from './pages/ListePresences';
import AjouterProfesseur from './pages/AjouterProfesseur';
import ListeProfesseurs from './pages/ListeProfesseurs';
import ProfesseurDashboard from './pages/ProfesseurDashboard';
import ListePresenceProf from './pages/ListePresenceProf';
import EtudiantsProfesseur from './pages/EtudiantsProfesseur';
import DashboardEtudiant from './pages/DashboardEtudiant';
import Profile from './pages/Profile';
import EtudiantPresences from './pages/EtudiantPresences';
import EvenementsProf from './pages/EvenementsProf';
import EvenementsEtudiant from './pages/EvenementsEtudiant';
import DocumentsEtudiant from './pages/DocumentsEtudiant';
import DocumentsProfesseur from './pages/DocumentsProfesseur';
import ExercicesCoursProf from './pages/ExercicesCoursProf';
import ListeCoursProf from './pages/ListeCoursProf';
import EtudiantPaiements from './pages/EtudiantPaiements';
import TeleverserExerciceEtudiant from './pages/TéléverserExerciceEtudiant';
import MesExercicesEtudiant from './pages/MesExercicesEtudiant';
import EtudiantLiveCours from './pages/EtudiantLiveCours';
import LiveCoursEtudiant from './pages/LiveCoursEtudiant';
import ProfLiveCours from './pages/ProfLiveCours';
import ProfileProfesseur from './pages/ProfileProfesseur';

import MessageProf from './pages/MessageProf';
import MessageEtudiant from './pages/MessageEtudiant';
import ProfileUpdatePage from './pages/ProfileUpdatePage';
import PaiementsExp from './pages/PaiementsExp';
import AdminAjouterSeance from './pages/AdminAjouterSeance';
import SeancesEtudiant from './pages/SeancesEtudiant';
import SeancesProfesseur from './pages/SeancesProfesseur';
import  CommercialPage from './pages/CommercialPage'; // Import de la page CommercialPage
import  StatistiquesEtudiants from './pages/StatistiquesEtudiants'; // Import de la page CommercialPage
import  ProfAjouterBulletin from './pages/ProfAjouterBulletin'; 
import  AdminBulletins from './pages/AdminBulletins'; 
import  EtudiantBulletins from './pages/EtudiantBulletins';
import Commercial from './pages/Commercial';
import Commercialetudiants from './pages/Commercialetudiants';
import PaiementManagerPage from './pages/PaiementManagerPage';
import AjouterPaiementmanager from './pages/AjouterPaiementmanager'; // Import de la page AjouterPaiementmanager
import ListePaiementsmanager from './pages/ListePaiementsmanager'; // Import de la page ListePaiementsmanager
import PaiementsExpmanger from './pages/PaiementsExpmanger'; // Import de la page PaiementsExpmanger
import Dashboardmanager from './pages/Dashboardmanager';
import EtudiantProfil from './pages/EtudiantProfil';
import ProfesseurProfil from './pages/ProfesseurProfil';



// Ajoutez cette route

   function AppContent() {
     const location = useLocation();
   
     useEffect(() => {
       let deferredPrompt;
   
       const handleBeforeInstallPrompt = (e) => {
         e.preventDefault();
         deferredPrompt = e;
   
         const installBtn = document.getElementById('install-button');
         if (installBtn) {
           installBtn.style.display = 'flex';
           
           const handleInstallClick = () => {
             installBtn.style.display = 'none';
             deferredPrompt.prompt();
             deferredPrompt.userChoice.then((choice) => {
               if (choice.outcome === 'accepted') {
                 console.log('✅ App installed');
               }
               deferredPrompt = null;
             });
           };
   
           installBtn.addEventListener('click', handleInstallClick);
           
           // Cleanup function pour éviter les fuites mémoire
           return () => {
             installBtn.removeEventListener('click', handleInstallClick);
           };
         }
       };
   
       window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
   
       return () => {
         window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
       };
     }, []);
   
     return (
       <>
         {/* Bouton d'installation - affiché uniquement sur la page de login */}
         {location.pathname === '/' && (
           <button
             id="install-button"
             style={{
               display: 'none',
               position: 'fixed',
               bottom: '20px',
               right: '20px',
               padding: '12px 18px',
               backgroundColor: '#4f46e5',
               color: 'white',
               fontWeight: 'bold',
               border: 'none',
               borderRadius: '8px',
               boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
               cursor: 'pointer',
               alignItems: 'center',
               gap: '8px',
               zIndex: 999
             }}
             title="Installer l'application"
           >
             <Download size={18} />
             Installer l'application
           </button>
         )}  

      <Routes>
        {/* Routes principales */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
 



        {/* Routes Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/liste-etudiants" element={<ListeEtudiants />} />
        <Route path="/ajouter-paiement" element={<AjouterPaiement />} />
        <Route path="/liste-paiements" element={<ListePaiements />} />
        <Route path="/liste-classes" element={<ListeCours />} />
        <Route path="/calendrier" element={<Calendrier />} />
        <Route path="/etudiants/:id" element={<ProfilEtudiant />} />
        <Route path="/ajouter-professeur" element={<AjouterProfesseur />} />
        <Route path="/liste-professeurs" element={<ListeProfesseurs />} />
        <Route path="/ajouter-presence" element={<AjouterPresence />} />
        <Route path="/liste-presences" element={<ListePresences />} />
        <Route path="/update-profil" element={<ProfileUpdatePage />} />
        <Route path="/paiements-exp" element={<PaiementsExp />} />
<Route path="/admin/seances" element={<AdminAjouterSeance />} />
<Route path="/etudiant/seances" element={<SeancesEtudiant />} />
<Route path="/professeur/seances" element={<SeancesProfesseur />} />

<Route path="/commercial" element={<Commercial />} /> 

<Route path="/professeur/AjouterBulletin" element={<ProfAjouterBulletin />} />


<Route path="/professeur/profil" element={<ProfesseurProfil />} />


<Route path="/manager/ListePaiement" element={<ListePaiementsmanager />} /> 

<Route path="/paiement-manager" element={<Dashboardmanager />} /> 
<Route path="/etudiant/profil" element={<EtudiantProfil />} />

<Route path="/manager/PaiementsExp" element={<PaiementsExpmanger />} /> 
<Route path="/manager/AjouterPaiement" element={<AjouterPaiementmanager />} /> 


<Route path="/admin/PaiementManager" element={< PaiementManagerPage />} />


<Route path="/commercial/etudiant" element={<Commercialetudiants />} />


<Route path="/admin/commercial" element={< CommercialPage />} />
<Route path="/admin/Bulletin" element={< AdminBulletins />} />


<Route path="/etudiant/Bulletin" element={< EtudiantBulletins />} />




<Route path="/admin/StatistiquesEtudiants" element={< StatistiquesEtudiants />} />

        {/* Routes Professeur */}
        <Route path="/professeur" element={<ProfesseurDashboard />} />
        <Route path="/professeur/profile" element={<ProfileProfesseur />} />
        <Route path="/presences" element={<ListePresenceProf />} />
        <Route path="/professeur/etudiants" element={<EtudiantsProfesseur />} />
        <Route path="/evenements-prof" element={<EvenementsProf />} />
        <Route path="/professeur/exercices/:nomCours" element={<ExercicesCoursProf />} />
        <Route path="/professeur/exercices" element={<ListeCoursProf />} />
        <Route path="/professeur/live" element={<ProfLiveCours />} />
        <Route path="/prof/documents" element={<DocumentsProfesseur />} />
<Route path="/professeur/messages" element={<MessageProf />} />


        {/* Routes Étudiant */}
        <Route path="/etudiant/messages" element={<MessageEtudiant />} />

        <Route path="/etudiant" element={<DashboardEtudiant />} />
        <Route path="/etudiant/profile" element={<Profile />} />
        <Route path="/etudiant/presences" element={<EtudiantPresences />} />
        <Route path="/etudiant/paiements" element={<EtudiantPaiements />} />
        <Route path="/evenements-etudiant" element={<EvenementsEtudiant />} />
        <Route path="/etudiant/documents" element={<DocumentsEtudiant />} />
        <Route path="/etudiant/mes-exercices" element={<MesExercicesEtudiant />} />
        <Route path="/etudiant/exercices/upload" element={<TeleverserExerciceEtudiant />} />
        <Route path="/etudiant/live" element={<LiveCoursEtudiant />} />
        <Route path="/etudiant/live/:cours" element={<EtudiantLiveCours />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}