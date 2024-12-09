'use client';

import { useState } from "react";
import { Button } from "./ui/button";
import { AuthModal } from "./auth/AuthModal";

interface AuthButtonProps {
    isAuthenticated: boolean;
}

const AuthButton = ({ isAuthenticated }: AuthButtonProps) => {
    const [showAuthModal, setShowAuthModal] = useState(false);

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="p-3">
            <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-medium py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
                Login / Sign up
            </Button>

            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
            />
        </div>
    );
};

export default AuthButton;
