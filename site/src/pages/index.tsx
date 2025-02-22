import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import SignInModal from '@/lib/components/landing/SignInModal';
import Logo from '@/lib/components/Logo';
import { Heart, Activity, Brain, Zap, ChevronRight, Shield } from 'lucide-react';

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
      <header className={`fixed w-full z-30 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-xl bg-background-100/80 border-b border-primary-200/30' : ''
      }`}>
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

      {/* Hero Section with Animation */}
      <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6 animate-fade-in">
                <Shield className="w-5 h-5 text-accent-500" />
                <span className="text-sm font-medium bg-accent-500/10 text-accent-600 px-3 py-1 rounded-full">
                  HIPAA Compliant
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-primary-900 mb-6 animate-slide-up">
                AI-Powered Cardiac
                <span className="text-accent-500"> Analysis</span>
              </h1>
              <p className="text-xl text-primary-600 mb-8 animate-slide-up-delay">
                Advanced cardiothoracic imaging analysis that helps doctors identify arterial blockages with unprecedented accuracy.
              </p>
              <div className="flex gap-4 animate-slide-up-delay-2">
                <button className="flex items-center gap-2 px-8 py-4 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  onClick={() => {signIn()}}
                >
                  Get Started
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 border border-primary-500/30 rounded-xl hover:bg-primary-800/10 transition-all duration-300">
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative lg:h-96 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 to-primary-500/20 rounded-3xl transform rotate-3 scale-95 blur-xl"></div>
              <div className="relative bg-white p-8 rounded-3xl shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center p-6 bg-primary-50 rounded-2xl">
                    <Activity className="w-12 h-12 text-accent-500 mb-4" />
                    <span className="text-sm font-medium text-primary-600">Real-time Analysis</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-accent-50 rounded-2xl">
                    <Brain className="w-12 h-12 text-accent-500 mb-4" />
                    <span className="text-sm font-medium text-primary-600">AI Insights</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-accent-50 rounded-2xl">
                    <Heart className="w-12 h-12 text-accent-500 mb-4" />
                    <span className="text-sm font-medium text-primary-600">Cardiac Focus</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-primary-50 rounded-2xl">
                    <Zap className="w-12 h-12 text-accent-500 mb-4" />
                    <span className="text-sm font-medium text-primary-600">Fast Results</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="animate-fade-in">
              <div className="text-4xl font-bold text-white mb-2">99.8%</div>
              <div className="text-primary-200">Accuracy Rate</div>
            </div>
            <div className="animate-fade-in-delay">
              <div className="text-4xl font-bold text-white mb-2">50,000+</div>
              <div className="text-primary-200">Analyses Completed</div>
            </div>
            <div className="animate-fade-in-delay-2">
              <div className="text-4xl font-bold text-white mb-2">2,000+</div>
              <div className="text-primary-200">Healthcare Providers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 bg-gradient-to-b from-background-100 to-accent-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-900 mb-4">
              Advanced Features for Medical Professionals
            </h2>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI technology with intuitive design to enhance your diagnostic workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Activity className="w-8 h-8" />,
                title: "Real-time Analysis",
                description: "Get instant insights as you upload patient imaging data, with immediate detection of potential concerns."
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: "AI-Powered Detection",
                description: "Advanced machine learning algorithms trained on extensive cardiac imaging datasets for accurate blockage detection."
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "HIPAA Compliant",
                description: "Enterprise-grade security ensuring all patient data is protected according to healthcare standards."
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: "Comprehensive Reports",
                description: "Detailed analysis reports with highlighted areas of concern and confidence scores."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Fast Processing",
                description: "Process multiple images quickly without compromising on accuracy or detail."
              },
              {
                icon: <Activity className="w-8 h-8" />,
                title: "Integration Ready",
                description: "Seamlessly integrates with your existing healthcare systems and workflows."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-accent-500/10 rounded-xl text-accent-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-primary-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-primary-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 px-6">
        <div className="absolute inset-0 bg-primary-900 skew-y-3 transform origin-bottom-right"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Cardiac Analysis?
          </h2>
          <p className="text-xl text-primary-200 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare providers using HeartScope to improve patient outcomes through advanced AI-powered analysis.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-4 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl">
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-white text-primary-900 rounded-xl hover:bg-primary-50 transition-all duration-300">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        .animate-slide-up-delay {
          animation: slide-up 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-slide-up-delay-2 {
          animation: slide-up 0.6s ease-out 0.4s forwards;
          opacity: 0;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s forwards;
          opacity: 0;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.6s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}