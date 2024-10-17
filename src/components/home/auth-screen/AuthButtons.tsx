"use client"
import React from 'react'
import { Button } from '../../ui/button'
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";

const AuthButtons = () => {
  return (
    <div className="flex gap-3 flex-1 md:flex-row flex-col">
      <RegisterLink className="flex-1">
        <Button className="w-full" variant="outline">Signup</Button>
      </RegisterLink>
      <LoginLink className="flex-1">
        <Button className="bg-[#f36198] w-full">Login</Button>
      </LoginLink>
    </div>
  )
}

export default AuthButtons
