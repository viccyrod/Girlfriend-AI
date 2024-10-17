'use client';

import React from 'react';
import HeroSection from './HeroSection';
import { Button } from "@/components/ui/button";

const AuthScreen = () => {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <div className="mt-8 flex justify-center">
        <a href="/login">
          <Button className="px-6 py-2">
            Log In / Sign Up
          </Button>
        </a>
      </div>
    </div>
  );
};

export default AuthScreen;
