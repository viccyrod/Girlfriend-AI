import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { sendEmail } from '@/lib/email/emailService';
import { z } from 'zod';

// Request validation schema
const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  template: z.enum(['welcome', 'reset-password', 'model-complete', 'token-low']),
  data: z.record(z.any()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string().optional()
  })).optional()
});

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const result = SendEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: result.error.issues 
      }, { status: 400 });
    }

    // Send email
    await sendEmail(result.data);

    return NextResponse.json({ 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get email settings
export async function GET(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email settings
    const emailSettings = await prisma.emailSettings.findUnique({
      where: { userId: user.id },
      select: {
        unsubscribed: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(emailSettings || { unsubscribed: false });

  } catch (error) {
    console.error('Failed to get email settings:', error);
    return NextResponse.json({ 
      error: 'Failed to get email settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update email settings
export async function PATCH(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { unsubscribed } = z.object({
      unsubscribed: z.boolean()
    }).parse(body);

    // Update email settings
    const settings = await prisma.emailSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        unsubscribed
      },
      update: {
        unsubscribed
      }
    });

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Failed to update email settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update email settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 