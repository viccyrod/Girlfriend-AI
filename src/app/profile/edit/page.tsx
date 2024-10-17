'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import BaseLayout from "@/components/BaseLayout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'

// Function to fetch user data from the API
const fetchUserData = async () => {
  const response = await fetch('/api/user')
  if (!response.ok) {
    throw new Error('Failed to fetch user data')
  }
  return response.json()
}

// Function to update user data via API
const updateUserData = async (userData: { name: string, bio: string }) => {
  const response = await fetch('/api/user', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  if (!response.ok) {
    throw new Error('Failed to update user data')
  }
  return response.json()
}

// EditProfilePage component
const EditProfilePage = () => {
  // Initialize router for navigation
  const router = useRouter()
  // Initialize queryClient for managing React Query cache
  const queryClient = useQueryClient()

  // Fetch user data using React Query
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData
  })

  // State for form fields
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')

  // Update form fields when userData is loaded
  useEffect(() => {
    if (userData) {
      setName(userData.name || '')
      setBio(userData.bio || '')
    }
  }, [userData])

  // Setup mutation for updating user data
  const updateMutation = useMutation({
    mutationFn: updateUserData,
    onSuccess: () => {
      // Invalidate and refetch userData after successful update
      queryClient.invalidateQueries({ queryKey: ['userData'] })
      // Redirect to profile page
      router.push('/profile')
    },
  })

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Trigger mutation with form data
    updateMutation.mutate({ name, bio })
  }

  // Show loading state
  if (isLoading) return <p>Loading...</p>
  // Show error state
  if (error) return <p>Error: {error.message}</p>

  // Render edit profile form
  return (
    <BaseLayout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          {/* Bio input field */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1"
            />
          </div>
          {/* Submit button */}
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </BaseLayout>
  )
}

export default EditProfilePage
