const ChatWindow = () => {


  return (
    <iframe
      src="https://rounded-corners-production.up.railway.app/"
      style={{
        position: 'fixed',
        bottom: '50px',
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

export default ChatWindow;