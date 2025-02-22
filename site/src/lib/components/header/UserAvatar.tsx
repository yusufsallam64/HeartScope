import React, { useState } from 'react';
import { Session } from 'next-auth';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface UserAvatarProps {
  session: Session | null;
  onClick?: (() => void | undefined);
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ session, onClick, size }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <button
      onClick={onClick ?? (() => {})}
      className={clsx(
        "relative group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-300",
        "bg-background-100 hover:bg-background-900",
        "border border-primary-200/10",
        onClick && [
          'cursor-pointer',
          'hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]',
        ]
      )}
      style={{ transform: `scale(${size ? size : 1})` }}
      title={'User'}
    >
      {/* Avatar container */}
      <div className="relative h-8 w-8">
        <div className="relative h-full w-full rounded-full overflow-hidden">
          {session?.user?.image && !imageError ? (
            <img
              src={session.user.image}
              alt="User avatar"
              className="object-cover w-full h-full"
              onError={handleImageError}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-primary-100 text-primary-900 font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase
                ? session.user.name.charAt(0).toUpperCase()
                : 'U'}
            </div>
          )}
        </div>
      </div>
      {/* User details */}
      <div className="flex flex-col items-start justify-center">
        <span className="text-sm font-semibold text-primary-100/80 group-hover:text-primary-100 transition-colors duration-200">
          {session?.user?.name ?? 'User'}
        </span>
      </div>

      {/* Dropdown indicator */}
      <ChevronDown className="w-4 h-4 text-primary-100/60" />
    </button>
  );
};

export default UserAvatar;