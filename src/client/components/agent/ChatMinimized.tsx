const ChatMinimized : React.FC<{onClick : () => void}> = ({onClick}) => {


  return (
    <div 
    className="fixed bottom-6 right-6" 
    style={{
      bottom: '50px',
      right: '50px',
      position: 'fixed',
    }} 
    onClick={onClick}
    >
      <button className="
          bg-[#D9757F] text-white
          p-4 rounded-full shadow-md hover:shadow-lg
          transform transition-all duration-300
          hover:-translate-y-1 hover:bg-[#82464C]
        ">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="lucide lucide-message-circle w-6 h-6"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
        </svg>
      </button>
    </div>
  );

};

export default ChatMinimized;