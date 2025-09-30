import React, { useEffect, useState } from 'react';

const ProfLiveCours = () => {
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [showJitsi, setShowJitsi] = useState(false);

  useEffect(() => {
    const fetchCours = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://vmi1977988.contaboserver.net/api2/professeur/mes-cours', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setCours(data.map(c => c.nom)); // إذا `c.nom` هو اسم الكورس
      } catch (err) {
        console.error('Erreur chargement cours:', err);
      }
    };

    fetchCours();
  }, []);

  const handleStart = () => {
    if (!selectedCours) return;
    setShowJitsi(true);
  };

  const jitsiUrl = selectedCours ? `https://meet.jit.si/Zettat-${selectedCours.replace(/\s+/g, '-')}` : '';

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎥 جلسة مباشرة - للأستاذ</h2>

      {!showJitsi ? (
        <>
          <label>اختر الكورس لبدء البث:</label>
          <br />
          <select
            value={selectedCours}
            onChange={(e) => setSelectedCours(e.target.value)}
            style={{ padding: '10px', marginTop: '10px', marginBottom: '20px' }}
          >
            <option value="">-- اختر --</option>
            {cours.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
          <br />
          <button
            onClick={handleStart}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ▶️ بدء الجلسة
          </button>
        </>
      ) : (
        <div>
          <h3>🟢 البث قيد التشغيل لكورس: {selectedCours}</h3>
          <p>
            📢 أرسل هذا الرابط للطلاب:
            <br />
            <code style={{ background: '#f1f1f1', padding: '5px' }}>
              {jitsiUrl}
            </code>
          </p>

          <iframe
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture"
            style={{
              width: '100%',
              height: '600px',
              border: '1px solid #ccc',
              borderRadius: '10px',
              marginTop: '20px'
            }}
            title="Jitsi Live"
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default ProfLiveCours;
