import React from 'react';

const JitsiLiveClass = ({ roomName }) => {
  const domain = "meet.jit.si";
  const iframeSrc = `https://${domain}/${roomName}`;

  return (
    <div>
      <h2>🎥 جلسة مباشرة: {roomName}</h2>
      <iframe
        src={iframeSrc}
        allow="camera; microphone; fullscreen; display-capture"
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ccc',
          borderRadius: '10px'
        }}
        title="Jitsi Live Session"
      ></iframe>
    </div>
  );
};

export default JitsiLiveClass;
