import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, VideoIcon } from '@radix-ui/react-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Function to create a new post (you'll need to implement this)
const createPost = async (postData: { text: string, mediaType: string }) => {
  // Implement your API call here
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  })
  if (!response.ok) {
    throw new Error('Failed to create post')
  }
  return response.json()
}

const CreatePost = () => {
  const [text, setText] = useState('')
  const [mediaType, setMediaType] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setText('')
      setMediaType(null)
      console.log('Post created:', data)
    },
    onError: (error) => {
      console.error('Error creating post:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    createPostMutation.mutate({ text, mediaType: mediaType || '' })
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Create a new post</CardTitle>
        <CardDescription>Share your thoughts or media with your followers</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-2"
          />
          <div className="flex justify-between items-center">
            <div>
              <Button
                type="button"
                variant={mediaType === 'image' ? 'default' : 'outline'}
                onClick={() => setMediaType('image')}
                className="mr-2"
              >
                <ImageIcon className="mr-2 h-4 w-4" /> Image
              </Button>
              <Button
                type="button"
                variant={mediaType === 'video' ? 'default' : 'outline'}
                onClick={() => setMediaType('video' as string)}
              >
                <VideoIcon className="mr-2 h-4 w-4" /> Video
              </Button>
            </div>
            <Button type="submit" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CreatePost
