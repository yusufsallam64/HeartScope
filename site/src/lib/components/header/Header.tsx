import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import UserDropdown from './UserDropdown';
import UserAvatar from './UserAvatar';
import Sidebar from './Sidebar';
import Logo from '../Logo';

interface HeaderProps {
  children: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleUserAvatarClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background-100">
      <header className="fixed top-0 left-0 right-0 h-16 bg-background-100/95 backdrop-blur-xl border-b border-primary-200/30 px-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <div className="px-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-xl font-title hover:opacity-80 transition-all duration-200 flex items-center gap-3"
            >
              <Logo size={32} />
              <span className="hidden sm:inline font-bold text-accent-400">
                HeartScope
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar
              isOpen={isDropdownOpen}
              session={session}
              onClick={handleUserAvatarClick}
            />
            <UserDropdown
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
            />
          </div>
        </div>
      </header>
      <div className="flex pt-16 min-h-screen md:flex">
        <main className="flex-1 transition-all duration-300 ease-in-out overflow-x-hidden bg-background-100/50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Header;