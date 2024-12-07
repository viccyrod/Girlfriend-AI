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
      start(controller) {
        // Send initial connection message
        const initialMessage = encoder.encode('data: {"connected":true}\n\n')
        controller.enqueue(initialMessage)

        // Message handler with correct type signature
        const sendMessage = (data: { message: Message }) => {
          try {
            const messageData = encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            controller.enqueue(messageData)
          } catch (error) {
            console.error('Error sending message:', error)
          }
        }

        // Subscribe to messages
        messageEmitter.on(`chat:${params.id}`, sendMessage)

        // Clean up on connection close
        request.signal.addEventListener('abort', () => {
          messageEmitter.off(`chat:${params.id}`, sendMessage)
          controller.close()
          console.log(`[SSE] Unsubscribed from chat:${params.id}`)
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Content-Encoding': 'none'
      }
    })
  } catch (error) {
    console.error('Error in SSE setup:', error)
    return new Response('Failed to setup SSE connection', { status: 500 })
  }
} 