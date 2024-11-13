import { NextResponse, NextRequest } from 'next/server';
import { testAIConnection } from '@/lib/ai-client';

// Handle GET requests
export async function GET(request: NextRequest) {  // Changed Request to NextRequest
  try {
    console.log('🚀 Starting X.AI test endpoint...');

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized - No valid auth token provided' 
      }, { status: 401 });
    }

    // Get message from query parameters
    const { searchParams } = new URL(request.url);
    const testMessage = searchParams.get('message') || "Hello, this is a test message";

    console.log('📝 Test message:', testMessage);

    // Test X.AI connection
    await testAIConnection(testMessage);
    
    return NextResponse.json({
      status: 'success',
      message: 'X.AI API connection test successful',
      testMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ X.AI test endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'X.AI API connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
