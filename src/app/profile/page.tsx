'use client'

import React from 'react'
import BaseLayout from "@/components/BaseLayout"
import UserProfile from "@/components/home/home-screen/UserProfile"
import { useQuery } from "@tanstack/react-query"

// Function to fetch user data
const fetchUserData = async () => {
  const response = await fetch('/api/user')
  if (!response.ok) {
    throw new Error('Failed to fetch user data')
  }
  return response.json()
}

const ProfilePage = () => {
  // Use React Query to fetch and manage user data
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData,
  })

  return (
    <BaseLayout>
      {isLoading && <p>Loading user profile...</p>}
      {error && <p>Error loading user profile: {error.message}</p>}
      {userData && <UserProfile user={userData} />}
    </BaseLayout>
  )
}

export default ProfilePage

