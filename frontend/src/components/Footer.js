import React from 'react';
import { GraduationCap } from 'lucide-react';

const Footer = () => {
  const styles = {
    footer: {
background: 'linear-gradient(135deg, #e60039 0%, #8a2be2 100%)',
      color: 'white',
      padding: '3rem 0'
    },
    sectionContainer: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 1rem'
    },
    footerGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem'
    },
    footerSection: {
      marginBottom: '1rem'
    },
    footerTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '1rem'
    },
    footerLinks: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    
    },
  footerLink: {
  color: '#ffffff', // blanc au lieu de gris
  textDecoration: 'none',
  display: 'block',
  padding: '0.25rem 0',
  transition: 'color 0.3s'
},

    footerBottom: {
      borderTop: '1px solid #374151',
      marginTop: '2rem',
      paddingTop: '2rem',
      textAlign: 'center',
      color: '#9ca3af'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    },
    logoText: {
      display: 'flex',
      flexDirection: 'column'
    },
    logoTitle: {
      fontSize: '1.125rem',
      fontWeight: 'bold',
      margin: 0
    },
    logoSubtitle: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      margin: 0
    }
  };

  return (
    <>
      <footer style={styles.footer}>
        <div style={styles.sectionContainer}>
          <div style={styles.footerGrid}>
            <div>
              <div style={styles.logo}>
                <div style={styles.logoIcon}>
 <img 
    src="/logo-ak.png" 
    alt="Logo Alfred Kastler" 
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}
  />





                </div>
                <div style={styles.logoText}>
                  <h3 style={styles.logoTitle}>Alfred Kastler</h3>
                  <p style={{ color: 'white', marginTop: '1rem' }}>Excellence Éducative</p>
                </div>
              </div>
              <p style={{ color: 'white', marginTop: '1rem' }}>
                Groupe scolaire d'excellence situé à Casablanca, offrant un parcours éducatif complet de la crèche au lycée.
              </p>
            </div>
            
            <div>
              <h4 style={styles.footerTitle}>Cycles</h4>
              <ul style={styles.footerLinks}>
                <li><a href="#" style={styles.footerLink} className="footer-link">Crèche & Préscolaire</a></li>
                <li><a href="#" style={styles.footerLink} className="footer-link">École Primaire</a></li>
                <li><a href="#" style={styles.footerLink} className="footer-link">Collège</a></li>
                <li><a href="#" style={styles.footerLink} className="footer-link">Lycée</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={styles.footerTitle}>Services</h4>
              <ul style={styles.footerLinks}>
                <li><a href="#" style={styles.footerLink} className="footer-link">Transport Scolaire</a></li>
                <li><a href="#" style={styles.footerLink} className="footer-link">Restauration</a></li>
                <li><a href="#" style={styles.footerLink} className="footer-link">Activités Périscolaires</a></li>
                <li><a href="#" style={styles.footerLink} className="footer-link">Soutien Scolaire</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={styles.footerTitle}>Contact</h4>
              <div style={{ color: 'white', marginTop: '1rem' }}>
                <p>130, Bd Ali Yaàta</p>
                <p>Hay Al Mohammadi, Casablanca</p>
                <p>+212 5 22 62 81 82</p>
                <p>contact@kastler.ma</p>
              </div>
            </div>
          </div>
          
          <div style={styles.footerBottom}>
            <p>&copy; 2025 Groupe Scolaire Alfred Kastler. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .footer-link:hover {
          color: white;
        }
      `}</style>
    </>
  );
};

export default Footer;