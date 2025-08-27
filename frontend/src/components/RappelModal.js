import React from 'react';
import { Bell, Calendar, FileText, Check, Trash2, X, User, BookOpen, DollarSign } from 'lucide-react';

const RappelModal = ({
  rappel,
  onClose,
  onUpdate,
  onDelete,
  editDate,
  setEditDate,
  editNote,
  setEditNote
}) => {
  if (!rappel) return null;

  // Protection supplémentaire pour l'affichage
  const etudiantNom =
    rappel.etudiant?.nomComplet ||
    rappel.etudiantNom ||
    'Étudiant non défini';

  const coursNom = rappel.cours || 'Cours non défini';
  const montant = rappel.montantRestant ?? '0';

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="modal"
        style={{
          backgroundColor: '#ffffff',
          padding: '32px',
          borderRadius: '16px',
          maxWidth: '540px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {/* En-tête */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            backgroundColor: '#3b82f6',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bell size={20} color="white" />
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#1e293b'
          }}>
            Gérer le Rappel
          </h2>
        </div>

        {/* Informations du rappel */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <User size={16} color="#64748b" />
            <div>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Étudiant:</span>
              <span style={{ marginLeft: '8px', color: '#1e293b', fontWeight: '600' }}>{etudiantNom}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <BookOpen size={16} color="#64748b" />
            <div>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Cours:</span>
              <span style={{ marginLeft: '8px', color: '#1e293b', fontWeight: '600' }}>{coursNom}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <DollarSign size={16} color="#dc2626" />
            <div>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Montant qui donnée:</span>
              <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: '700' }}>{montant} Dh</span>
            </div>
          </div>
        </div>

        {/* Champ date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            <Calendar size={16} />
            Nouvelle date de rappel
          </label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Champ note */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            <FileText size={16} />
            Note (optionnelle)
          </label>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            rows={3}
            placeholder="Ajouter une note pour ce rappel..."
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '80px',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '20px'
        }}>
          <button
            onClick={onUpdate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#059669',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#047857';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#059669';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Check size={16} />
            Replanifier
          </button>

          <button
            onClick={onDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Trash2 size={16} />
            Supprimer
          </button>

          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#4b5563';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#6b7280';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <X size={16} />
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default RappelModal;