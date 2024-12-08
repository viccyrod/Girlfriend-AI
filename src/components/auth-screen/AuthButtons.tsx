"use client"
import React, { useState } from 'react'
import { Button } from '../ui/button'

const AuthButtons = () => {
    const [loading, setLoading] = useState(false);

    return (
        <div className="flex gap-3 flex-1 md:flex-row flex-col">
            <a 
                href="/api/auth/register" 
                className="flex-1"
                onClick={() => setLoading(true)}
            >
                <Button 
                    className="w-full" 
                    variant="outline" 
                    disabled={loading}
                >
                    Signup
                </Button>
            </a>
            <a 
                href="/api/auth/login" 
                className="flex-1"
                onClick={() => setLoading(true)}
            >
                <Button 
                    className="w-full" 
                    disabled={loading}
                    style={{ backgroundColor: '#9138ab', color: 'white' }}
                >
                    Login
                </Button>
            </a>
        </div>
    )
}

export default AuthButtons
