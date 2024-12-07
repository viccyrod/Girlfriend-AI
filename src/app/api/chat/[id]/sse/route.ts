import { NextRequest } from 'next/server'
import { messageEmitter } from '@/lib/messageEmitter'
import prisma from '@/lib/prisma'
import { Message } from '@prisma/client'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify user has access to this chat room
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            email: currentUser.email
          }
        }
      }
    })

    if (!chatRoom) {
      return new Response('Chat room not found or access denied', { status: 403 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        console.log(`SSE: Starting connection for chat ${params.id}`)
        
        const sendMessage = (message: Message) => {
          try {
            console.log(`SSE: Sending message for chat ${params.id}`, message.id)
            const data = JSON.stringify(message)
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          } catch (error) {
            console.error('Error sending message:', error)
          }
        }

        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: {"type":"connected","timestamp":${Date.now()}}\n\n`)
        )

        // Set up ping interval
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: {"type":"ping","timestamp":${Date.now()}}\n\n`)
            )
          } catch (error) {
            console.error('Error sending ping:', error)
            clearInterval(pingInterval)
          }
        }, 5000)

        // Subscribe to messages
        messageEmitter.on(`chat:${params.id}`, sendMessage)

        // Clean up on connection close
        request.signal.addEventListener('abort', () => {
          console.log(`SSE: Cleaning up connection for chat ${params.id}`)
          clearInterval(pingInterval)
          messageEmitter.off(`chat:${params.id}`, sendMessage)
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    })
  } catch (error) {
    console.error('SSE Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 