"use client"

import { useRouter } from "next/navigation"

interface ClientAuthWrapperProps {
  children: React.ReactNode
  isAuthenticated: boolean
}

const ClientAuthWrapper = ({ children, isAuthenticated }: ClientAuthWrapperProps) => {
  const router = useRouter()

  const handleInteraction = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault()
      e.stopPropagation()
      router.push('/auth/login')
    }
  }

  return (
    <div onClick={handleInteraction}>
      {children}
    </div>
  )
}

export default ClientAuthWrapper 