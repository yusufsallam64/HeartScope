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

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-background-950 overflow-x-hidden">
      <header className={`fixed w-full z-30 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-background-950/80 border-b border-primary-200/30' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <span className="text-2xl font-bold bg-gradient-to-r from-accent-400 via-accent-500 to-secondary-300 text-transparent bg-clip-text font-title">
                SolMate
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className="px-6 py-2 text-primary-100 border border-primary-200/30 rounded-xl hover:bg-accent-500/10 hover:border-accent-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-6 py-2 bg-accent-600 text-white rounded-xl hover:bg-accent-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300"
              >
                Get Started
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