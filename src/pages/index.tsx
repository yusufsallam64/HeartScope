import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import SignInModal from '@/lib/components/landing/SignInModal';
import Logo from '@/lib/components/Logo';

export default function Splash() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-background-100 overflow-x-hidden">
      <header className={`fixed w-full z-30 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-background-100/80 border-b border-primary-200/30' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <span className="text-2xl font-title text-accent-400">
                HeartScope
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className="px-6 py-2 text-primary-800 border border-primary-500/30 rounded-xl hover:bg-primary-800/10 hover:border-accent-800/30 transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
}