import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen
}) => {
  return (
    <div className={`md:static top-16 bg-background-100/50 backdrop-blur-xl border-r border-primary-200/30 shadow-lg transition-all duration-300 h-[calc(100vh-4rem)] ${isOpen ? 'w-full md:w-72' : 'w-0 overflow-hidden'}`}>
      <div className="h-full flex flex-col min-w-[18rem]">
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-primary-200/30 bg-background-300/20">
          <h2 className="text-lg font-title text-text-700 font-bold">Past Analyses</h2>
            <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-text-700 hover:text-text-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v12M6 12h12"
                />
              </svg>
            </button>

            

        </div>
      </div>
    </div>
  );
};

export default Sidebar;