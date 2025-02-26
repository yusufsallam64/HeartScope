import React, { useRef, useEffect } from 'react';
import { Settings, LogOut, MessageSquare } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: '/'
      });
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    }
  };

  if (!isOpen) return null;

  return (
    <div>
      <div 
        className="fixed inset-0 z-30 "
        onClick={onClose}
      />
      <div
        className="absolute right-0 top-14 w-48 z-40 animate-in fade-in slide-in-from-top-2 duration-200"
        ref={dropdownRef}
        onClick={(e) => e.stopPropagation()} // Stop event propagation here
      >
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-accent-500/20 opacity-0 group-hover:opacity-100 rounded-xl blur transition duration-300" />
        
        {/* Dropdown content */}
        <div className="relative rounded-xl bg-background-800 border border-primary-200/30 overflow-hidden">
          <div className="py-1">
            <button
              className="w-full px-4 py-2.5 text-left text-primary-100 hover:bg-accent-500/10 flex items-center gap-2.5 transition-all duration-200 group"
              onClick={handleSignOut}
            >
              <LogOut size={16} className="text-accent-400 group-hover:text-accent-300 transition-colors duration-200" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDropdown;