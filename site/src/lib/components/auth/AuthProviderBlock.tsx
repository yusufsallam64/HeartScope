import Image from "next/image";
import React, { FC } from "react";
import { ClientSafeProvider, signIn } from "next-auth/react";

interface OAuthLoginBlockProps {
    providerName: string;
    iconLink: string;
    provider: ClientSafeProvider;
    callbackUrl?: string;
}

const OAuthLoginBlock: FC<OAuthLoginBlockProps> = ({ provider, providerName, iconLink, callbackUrl }) => (
    <button
        onClick={() => signIn(provider.id, { callbackUrl })}
        className="flex items-center gap-2 px-8 py-4 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl group relative overflow-hidden m-auto"
    >
        <div className="absolute inset-0 bg-accent-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex items-center w-full">
            <div className="h-8 w-8 relative shrink-0">
                <Image 
                    src={iconLink} 
                    alt={`${providerName} icon`}
                    className="object-contain" 
                    fill={true}
                />
            </div>
            
            <div className="mx-6 h-8 w-px bg-primary-200/20" />
            
            <span className="grow text-center text-lg text-primary-100 group-hover:text-white transition-colors duration-300">
                Continue with {providerName}
            </span>
        </div>
    </button>
);

export default OAuthLoginBlock;