import React from 'react';
import { useParams } from 'react-router-dom';
import JitsiLiveClass from '../components/JitsiLiveClass';

const EtudiantLiveCours = () => {
  const { cours } = useParams();

  // يمكنك توليد اسم غرفة بناءً على الدورة والتاريخ
  const roomName = `zettat_${cours}_${new Date().toISOString().slice(0, 10)}`;

  return (
    <div style={{ padding: '20px' }}>
      <h1>📡 بث مباشر لدورة: {cours}</h1>
      <JitsiLiveClass roomName={roomName} />
    </div>
  );
};

export default EtudiantLiveCours;
