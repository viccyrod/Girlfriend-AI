"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import AuthScreen from "@/components/auth-screen/AuthScreen"

interface ClientAuthWrapperProps {
  children: React.ReactNode
  isAuthenticated: boolean
}

const ClientAuthWrapper = ({ children, isAuthenticated }: ClientAuthWrapperProps) => {
  const [showAuth, setShowAuth] = useState(false)

  const handleInteraction = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault()
      e.stopPropagation()
      setShowAuth(true)
    }
  }

  return (
    <>
      <div onClick={handleInteraction}>
        {children}
      </div>

      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <AuthScreen />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ClientAuthWrapper 