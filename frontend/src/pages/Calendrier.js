import React, { useEffect, useState } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import Sidebar from '../components/sidberadmin';
import './Calendrier.css';

// Configuration de moment en français
moment.locale('fr', {
  months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split('_'),
  monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split('_'),
  weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
  weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
  weekdaysMin: 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_')
});

const localizer = momentLocalizer(moment);

const Calendrier = () => {
  const [evenements, setEvenements] = useState([]);
  const [evenementActuel, setEvenementActuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    titre: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    type: 'autre'
  });

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('tous');
  const [searchDateDebut, setSearchDateDebut] = useState('');
  const [searchDateFin, setSearchDateFin] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    const fetchEvenements = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://vmi1977988.contaboserver.net/api2/evenements', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Vérification plus stricte des données
        const eventsFormatted = res.data
          .filter(e => {
            return e && 
                   e.titre && 
                   e.dateDebut && 
                   typeof e.titre === 'string' && 
                   e.titre.trim() !== '';
          })
          .map(e => {
            const titre = e.titre || 'Sans titre';
            const type = e.type || 'autre';
            const dateDebut = new Date(e.dateDebut);
            const dateFin = e.dateFin ? new Date(e.dateFin) : new Date(e.dateDebut);

            if (isNaN(dateDebut.getTime())) {
              console.warn('Date de début invalide pour l\'événement:', e);
              return null;
            }

            if (isNaN(dateFin.getTime())) {
              console.warn('Date de fin invalide pour l\'événement:', e);
              return null;
            }

            return {
              id: e._id,
              title: `${titre} (${type})`,
              start: dateDebut,
              end: dateFin,
              allDay: true,
              description: e.description || '',
              type: type,
              raw: e
            };
          })
          .filter(e => e !== null);

        console.log("✔️ Events chargés:", eventsFormatted);
        setEvenements(eventsFormatted);
        setLoading(false);
      } catch (err) {
        console.error('Erreur chargement événements:', err);
        setError(err.message);
        setEvenements([]);
        setLoading(false);
      }
    };

    fetchEvenements();
  }, []);

  // Fonction de recherche et filtrage
  const applyFilters = () => {
    let filtered = [...evenements];

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.raw.titre?.toLowerCase().includes(term) ||
        event.raw.description?.toLowerCase().includes(term)
      );
    }

    // Filtrage par type
    if (searchType !== 'tous') {
      filtered = filtered.filter(event => event.raw.type === searchType);
    }

    // Filtrage par date de début
    if (searchDateDebut) {
      const startDate = new Date(searchDateDebut);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.raw.dateDebut);
        return eventDate >= startDate;
      });
    }

    // Filtrage par date de fin
    if (searchDateFin) {
      const endDate = new Date(searchDateFin);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.raw.dateDebut);
        return eventDate <= endDate;
      });
    }

    setFilteredEvents(filtered);
  };

  // Effet pour appliquer les filtres quand les critères changent
  useEffect(() => {
    applyFilters();
  }, [searchTerm, searchType, searchDateDebut, searchDateFin, evenements]);

  // Réinitialiser la recherche
  const resetSearch = () => {
    setSearchTerm('');
    setSearchType('tous');
    setSearchDateDebut('');
    setSearchDateFin('');
    setShowAdvancedSearch(false);
  };

  // Fonction pour valider les événements avant de les passer au Calendar
  const getValidEvents = () => {
    const eventsToShow = filteredEvents.length > 0 || searchTerm || searchType !== 'tous' || searchDateDebut || searchDateFin 
      ? filteredEvents 
      : evenements;

    if (!Array.isArray(eventsToShow)) {
      console.warn('eventsToShow n\'est pas un tableau:', eventsToShow);
      return [];
    }
    
    const validEvents = eventsToShow
      .filter(e => {
        const isValid = e && 
          typeof e === 'object' &&
          e.title && 
          e.start && 
          e.end && 
          typeof e.title === 'string' && 
          e.title.trim() !== '' &&
          e.start instanceof Date && 
          e.end instanceof Date &&
          !isNaN(e.start.getTime()) &&
          !isNaN(e.end.getTime());
        
        if (!isValid) {
          console.warn('Événement invalide détecté:', e);
        }
        
        return isValid;
      })
      .map(e => ({
        id: e.id,
        title: String(e.title),
        start: new Date(e.start),
        end: new Date(e.end),
        allDay: Boolean(e.allDay),
        description: String(e.description || ''),
        type: String(e.type || 'autre'),
        raw: e.raw
      }));

    console.log('Events valides à passer au Calendar:', validEvents);
    console.log('Nombre d\'événements valides:', validEvents.length);
    
    return validEvents;
  };

  // Gestionnaire pour changement de vue
  const handleViewChange = (view) => {
    console.log('Vue changée vers:', view);
    setCurrentView(view);
  };

  // Gestionnaire pour changement de date
  const handleNavigate = (date) => {
    console.log('Navigation vers:', date);
    setCurrentDate(date);
  };

  // Gestionnaire pour modifier un événement
  const handleEditEvent = (event) => {
    console.log('Modification de l\'événement:', event);
    setEditingEvent({
      _id: event._id,
      titre: event.titre || '',
      description: event.description || '',
      dateDebut: event.dateDebut ? moment(event.dateDebut).format('YYYY-MM-DD') : '',
      dateFin: event.dateFin ? moment(event.dateFin).format('YYYY-MM-DD') : '',
      type: event.type || 'autre'
    });
  };

  // Gestionnaire pour supprimer un événement
  const handleDeleteEvent = async (event) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.titre}" ?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`https://vmi1977988.contaboserver.net//api2/evenements/${event._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Recharger les événements
        await fetchEvenements();
        console.log('✅ Événement supprimé avec succès');
      } catch (err) {
        console.error('❌ Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression de l\'événement');
      }
    }
  };

  // Fonction pour recharger les événements
  const fetchEvenements = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://vmi1977988.contaboserver.net/api2/evenements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const eventsFormatted = res.data
        .filter(e => e && e.titre && e.dateDebut && typeof e.titre === 'string' && e.titre.trim() !== '')
        .map(e => ({
          id: e._id,
          title: `${e.titre} (${e.type || 'autre'})`,
          start: new Date(e.dateDebut),
          end: e.dateFin ? new Date(e.dateFin) : new Date(e.dateDebut),
          allDay: true,
          description: e.description || '',
          type: e.type || 'autre',
          raw: e
        }))
        .filter(e => e !== null);
      
      setEvenements(eventsFormatted);
    } catch (err) {
      console.error('Erreur lors du rechargement:', err);
    }
  };

  // Sauvegarder les modifications
  const saveEditedEvent = async () => {
    try {
      if (!editingEvent.titre.trim()) {
        alert('Le titre est obligatoire');
        return;
      }

      const token = localStorage.getItem('token');
      await axios.put(`https://vmi1977988.contaboserver.net//api2/evenements/${editingEvent._id}`, {
        titre: editingEvent.titre,
        description: editingEvent.description,
        dateDebut: editingEvent.dateDebut,
        dateFin: editingEvent.dateFin || editingEvent.dateDebut,
        type: editingEvent.type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Recharger les événements
      await fetchEvenements();
      setEditingEvent(null);
      console.log('✅ Événement modifié avec succès');
      alert('Événement modifié avec succès !');
    } catch (err) {
      console.error('❌ Erreur lors de la modification:', err);
      alert('Erreur lors de la modification de l\'événement');
    }
  };

  // Gérer les changements dans le formulaire de modification
  const handleEditInputChange = (field, value) => {
    setEditingEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gérer les changements dans le formulaire d'ajout
  const handleNewEventChange = (field, value) => {
    setNewEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Ajouter un nouvel événement
  const addNewEvent = async () => {
    try {
      if (!newEvent.titre.trim()) {
        alert('Le titre est obligatoire');
        return;
      }

      if (!newEvent.dateDebut) {
        alert('La date de début est obligatoire');
        return;
      }

      const token = localStorage.getItem('token');
      await axios.post('https://vmi1977988.contaboserver.net/api2/evenements', {
        titre: newEvent.titre,
        description: newEvent.description,
        dateDebut: newEvent.dateDebut,
        dateFin: newEvent.dateFin || newEvent.dateDebut,
        type: newEvent.type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Recharger les événements
      await fetchEvenements();
      resetSearch(); // هذا هو المفتاح لرؤية الحدث الجديد مباشرة

      // Réinitialiser le formulaire et fermer le modal
      setNewEvent({
        titre: '',
        description: '',
        dateDebut: '',
        dateFin: '',
        type: 'autre'
      });
      setShowAddModal(false);
      
      console.log('✅ Événement ajouté avec succès');
      alert('Événement ajouté avec succès !');
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout:', err);
      alert('Erreur lors de l\'ajout de l\'événement');
    }
  };

  // Obtenir les événements valides
  const validEvents = getValidEvents();

  return (
    <div style={{ display: 'flex', height: '80vh', margin: '20px', gap: '20px' }} className="calendrier-container">
      <Sidebar onLogout={handleLogout} />
      
      <div style={{ width: '400px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', overflowY: 'auto' }}>
        {/* Section de recherche */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '8px', border: '1px solid #bee5eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#0c5460' }}> Recherche Professionnelle</h4>
            <button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showAdvancedSearch ? ' Masquer' : ' Avancée'}
            </button>
          </div>

          {/* Recherche rapide */}
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder=" Rechercher par titre ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #bee5eb',
                borderRadius: '5px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>

          {/* Recherche avancée */}
          {showAdvancedSearch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', color: '#0c5460' }}>
                   Filtrer par type
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #bee5eb',
                    borderRadius: '4px',
                    fontSize: '13px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="tous">Tous les types</option>
                  <option value="paiement">Paiement</option>
                  <option value="examen"> Examen</option>
                  <option value="réunion"> Réunion</option>
                  <option value="formation"> Formation</option>
                  <option value="vacances"> Vacances</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', color: '#0c5460' }}>
                    📅 Dès le
                  </label>
                  <input
                    type="date"
                    value={searchDateDebut}
                    onChange={(e) => setSearchDateDebut(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #bee5eb',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', color: '#0c5460' }}>
                    📅 Jusqu'au
                  </label>
                  <input
                    type="date"
                    value={searchDateFin}
                    onChange={(e) => setSearchDateFin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #bee5eb',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button 
              onClick={resetSearch}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                flex: 1
              }}
            >
              Réinitialiser
            </button>
            
            <div style={{ 
              backgroundColor: '#d1ecf1', 
              color: '#0c5460', 
              padding: '6px 12px', 
              borderRadius: '4px', 
              fontSize: '12px',
              fontWeight: 'bold',
              flex: 1,
              textAlign: 'center'
            }}>
               {validEvents.length} résultat(s)
            </div>
          </div>
        </div>

        {/* En-tête de la liste */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3> Liste des événements</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 'bold'
            }}
          >
             Ajouter
          </button>
        </div>
        
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>🔄 Chargement...</div>}
        
        {error && <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '5px' }}>❌ Erreur: {error}</div>}
        
        {!loading && !error && (
          <>
            {/* Indicateur de filtrage */}
            {(searchTerm || searchType !== 'tous' || searchDateDebut || searchDateFin) && (
              <div style={{ 
                marginBottom: '15px', 
                padding: '8px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '5px', 
                fontSize: '12px',
                border: '1px solid #ffeaa7'
              }}>
                🔍 Filtres actifs - {validEvents.length} événement(s) trouvé(s) sur {evenements.length} total
              </div>
            )}
            
            {validEvents.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                {(searchTerm || searchType !== 'tous' || searchDateDebut || searchDateFin) 
                  ? 'Aucun événement ne correspond à vos critères de recherche'
                  : 'Aucun événement trouvé'
                }
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {validEvents.map((event) => (
                  <div key={event.id} style={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>
                      {event.raw?.titre || 'Sans titre'}
                    </h4>
                    
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      <div>📅 <strong>Du:</strong> {event.raw?.dateDebut ? new Date(event.raw.dateDebut).toLocaleDateString('fr-FR') : 'Date non définie'}</div>
                      <div>📅 <strong>Au:</strong> {event.raw?.dateFin ? new Date(event.raw.dateFin).toLocaleDateString('fr-FR') : new Date(event.raw.dateDebut).toLocaleDateString('fr-FR')}</div>
                      <div>📌 <strong>Type:</strong> {event.raw?.type || 'autre'}</div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px', maxHeight: '40px', overflow: 'hidden' }}>
                      <strong>📝 Description:</strong> {event.raw?.description || '—'}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event.raw);
                        }}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                         Modifier
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.raw);
                        }}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                         Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Calendrier principal */}
      <div style={{ flex: 1, padding: '10px' }}>
        <h2>📆 Calendrier des événements</h2>

        {!loading && !error && (
          <>
            <div style={{ 
              marginBottom: '10px', 
              padding: '10px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}>
              📊 {validEvents.length} événement(s) affiché(s) | Vue actuelle: {currentView}
              {(searchTerm || searchType !== 'tous' || searchDateDebut || searchDateFin) && (
                <span style={{ color: '#28a745', fontWeight: 'bold' }}> | 🔍 Filtres actifs</span>
              )}
            </div>
            
            {validEvents.length === 0 ? (
              <div style={{ 
                height: 600, 
                border: '1px solid #ccc', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '18px',
                color: '#666',
                backgroundColor: '#f9f9f9'
              }}>
                {(searchTerm || searchType !== 'tous' || searchDateDebut || searchDateFin) 
                  ? 'Aucun événement ne correspond à vos critères'
                  : 'Aucun événement à afficher'
                }
              </div>
            ) : (
              <div style={{ 
                height: '600px', 
                border: '2px solid #ddd', 
                borderRadius: '5px',
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                <Calendar
                  localizer={localizer}
                  events={validEvents}
                  startAccessor="start"
                  endAccessor="end"
                  titleAccessor="title"
                  views={[Views.MONTH, Views.WEEK, Views.DAY]}
                  view={currentView}
                  date={currentDate}
                  onView={handleViewChange}
                  onNavigate={handleNavigate}
                  style={{ 
                    height: '100%', 
                    width: '100%',
                    fontFamily: 'Arial, sans-serif'
                  }}
                  onSelectEvent={(event) => {
                    console.log('Événement sélectionné:', event);
                    if (event && event.raw) {
                      setEvenementActuel(event.raw);
                    }
                  }}
                  messages={{
                    date: 'Date',
                    time: 'Heure',
                    event: 'Événement',
                    allDay: 'Toute la journée',
                    week: 'Semaine',
                    work_week: 'Semaine de travail',
                    day: 'Jour',
                    month: 'Mois',
                    previous: 'Précédent',
                    next: 'Suivant',
                    yesterday: 'Hier',
                    tomorrow: 'Demain',
                    today: 'Aujourd\'hui',
                    agenda: 'Agenda',
                    noEventsInRange: 'Aucun événement dans cette période.',
                    showMore: (total) => `+ ${total} de plus`
                  }}
                  formats={{
                    dateFormat: 'DD',
                    dayFormat: (date, culture, localizer) =>
                      localizer.format(date, 'dddd', culture),
                    dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                      localizer.format(start, 'MMMM DD', culture) + ' – ' + 
                      localizer.format(end, 'MMMM DD', culture)
                  }}
                  eventPropGetter={(event) => ({
                    style: {
                      backgroundColor: event.type === 'paiement' ? '#4CAF50' : 
                                     event.type === 'examen' ? '#FF9800' : 
                                     event.type === 'réunion' ? '#2196F3' : '#9C27B0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px'
                    }
                  })}
                  popup
                  showMultiDayTimes
                  step={60}
                  timeslots={2}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal pour ajouter un événement */}
      {showAddModal && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '10px',
            width: '500px', 
    maxHeight: '80vh',
    overflowY: 'auto'
  }}>
    <h3 style={{ marginBottom: '20px', color: '#333' }}>Ajouter un événement</h3>

    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        📝 Titre *
      </label>
      <input
        type="text"
        value={newEvent.titre}
        onChange={(e) => handleNewEventChange('titre', e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          fontSize: '14px'
        }}
        placeholder="Titre de l'événement"
      />
    </div>

    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        📅 Date de début *
      </label>
      <input
        type="date"
        value={newEvent.dateDebut}
        onChange={(e) => handleNewEventChange('dateDebut', e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          fontSize: '14px'
        }}
      />
    </div>

    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        📅 Date de fin
      </label>
      <input
        type="date"
        value={newEvent.dateFin}
        onChange={(e) => handleNewEventChange('dateFin', e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          fontSize: '14px'
        }}
      />
    </div>

    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        📌 Type
      </label>
      <select
        value={newEvent.type}
        onChange={(e) => handleNewEventChange('type', e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          fontSize: '14px'
        }}
      >
        <option value="autre">Autre</option>
        <option value="paiement">Paiement</option>
        <option value="examen">Examen</option>
        <option value="réunion">Réunion</option>
        <option value="formation">Formation</option>
        <option value="vacances">Vacances</option>
      </select>
    </div>

    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        📄 Description
      </label>
      <textarea
        value={newEvent.description}
        onChange={(e) => handleNewEventChange('description', e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          fontSize: '14px',
          minHeight: '80px',
          resize: 'vertical'
        }}
        placeholder="Description de l'événement (optionnel)"
      />
    </div>

    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
      <button 
        onClick={() => setShowAddModal(false)}
        style={{
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
         Annuler
      </button>

      <button 
        onClick={addNewEvent}
        style={{
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Ajouter
      </button>
    </div>
  </div>
</div>
)}

</div>
);
};

export default Calendrier;
