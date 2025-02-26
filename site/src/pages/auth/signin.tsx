import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getProviders } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import Link from 'next/link';
import AuthProviderBlock from "@/lib/components/auth/AuthProviderBlock";

const SignIn = ({
    providers
}: InferGetServerSidePropsType<typeof getServerSideProps>): JSX.Element => {
    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-background-100/50">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-accent-400/10 rounded-full blur-3xl transform rotate-12" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-secondary-500/10 rounded-full blur-3xl transform -rotate-12" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center space-y-4">
                        <svg className="text-accent-400 w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h1 className="text-3xl font-bold">
                            <span className="bg-accent-400 text-transparent bg-clip-text">
                                Welcome Back
                            </span>
                        </h1>
                    </div>
                    <p className="mt-4 text-primary-100 text-lg">
                        Sign in to continue learning
                    </p>
                </div>

                <div className="w-full max-w-md">
                    <div className="p-6 bg-background-800/40 backdrop-blur-lg rounded-2xl border border-primary-900/50">
                        <div className="space-y-3">
                            {/* <PhantomConnect /> */}
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
                    </div>
                    
                    <div className="mt-6 text-center">
                        <Link 
                            href="/"
                            className="text-primary-200 hover:text-primary-100 transition-colors duration-200"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getServerSession(context.req, context.res, authOptions);
    
    if (session?.user?.email) {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        };
    }

    const providers = await getProviders();

    return {
        props: { 
            providers: providers ?? [] 
        }
    };
}

export default SignIn;