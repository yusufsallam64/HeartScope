import React, { useEffect, useRef, useState } from 'react';
import { getProviders } from "next-auth/react";
import { X } from 'lucide-react';
import AuthProviderBlock from '../auth/AuthProviderBlock';
import Link from 'next/link';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const [providers, setProviders] = useState<any>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProviders = async () => {
      const providers = await getProviders();
      setProviders(providers ?? {});
    };
    if (isOpen) {
      loadProviders();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-muted/10 backdrop-blur-sm" />
      
      {/* Ambient Light Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sidebar-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Modal Background */}
          <div className="absolute inset-0 bg-muted/90 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg" />

          {/* Content */}
          <div className="relative p-8">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-all duration-200"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center space-y-6">
              <h2 className="text-3xl font-bold text-foreground font-title">
                Welcome Back
              </h2>
              <p className="text-muted-foreground text-center">
                Sign in to your account to continue
              </p>
            </div>

            <div className="mt-8 w-full space-y-3">
              {Object.values(providers).map((provider: any) => (
                <div key={provider.id}>
                  <AuthProviderBlock
                    providerName={provider.name}
                    iconLink={`/providers/${provider.id}.png`}
                    provider={provider}
                    callbackUrl="/dashboard"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              New to HeartScope?{' '}
              <Link
                href="/auth/signup"
                className="text-accent-500 hover:underline font-medium"
                onClick={onClose}
              >
                Create an account
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;