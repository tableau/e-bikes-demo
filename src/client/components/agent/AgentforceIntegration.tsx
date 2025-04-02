const AgentforceIntegration = () => {


  return (
    <iframe
      src="https://tableau-agentforce-custom-client-production.up.railway.app/"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        height: '600px',
        border: 'none',
        zIndex: 999999
      }}
      allow="microphone"
    >
    </iframe>
  );

};

export default AgentforceIntegration;