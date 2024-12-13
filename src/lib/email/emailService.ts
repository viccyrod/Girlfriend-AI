import sgMail from '@sendgrid/mail';
import prisma from '@/lib/prisma';
import pRetry from 'p-retry';

// Email template types
export type EmailTemplate = 'welcome' | 'reset-password' | 'model-complete' | 'token-low';

interface EmailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn('Missing SendGrid API key. Emails will not be sent.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Template mapping
const templates: Record<EmailTemplate, (data: any) => string> = {
  'welcome': (data) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome to AI Girlfriend!</h1>
      <p>Hi ${data.name},</p>
      <p>Thank you for joining our platform. We're excited to have you here!</p>
      <p>You can start creating your AI companions right away.</p>
      <p>Best regards,<br/>The AI Girlfriend Team</p>
    </div>
  `,
  'reset-password': (data) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Password Reset Request</h1>
      <p>Hi ${data.name},</p>
      <p>You recently requested to reset your password. Click the link below to reset it:</p>
      <a href="${data.resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br/>The AI Girlfriend Team</p>
    </div>
  `,
  'model-complete': (data) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Your AI Model is Ready!</h1>
      <p>Hi ${data.name},</p>
      <p>Great news! Your AI model "${data.modelName}" has been successfully created.</p>
      <p>Click below to start chatting:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat/${data.modelId}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Start Chatting</a>
      <p>Best regards,<br/>The AI Girlfriend Team</p>
    </div>
  `,
  'token-low': (data) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Low Token Balance Alert</h1>
      <p>Hi ${data.name},</p>
      <p>Your token balance is running low. You currently have ${data.tokens} tokens remaining.</p>
      <p>To ensure uninterrupted service, please top up your tokens:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Add Tokens</a>
      <p>Best regards,<br/>The AI Girlfriend Team</p>
    </div>
  `
};

// Rate limiting configuration
const rateLimits = {
  maxRetriesPerEmail: 3,
  retryDelay: 1000
};

// Email sending function with retry logic
export async function sendEmail({ to, subject, template, data, attachments }: EmailOptions): Promise<void> {
  // Validate email template
  if (!templates[template]) {
    throw new Error(`Invalid email template: ${template}`);
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: to },
    select: {
      id: true,
      name: true,
      email: true,
      emailSettings: true
    }
  });

  if (!user) {
    throw new Error(`User not found with email: ${to}`);
  }

  // Check user's email preferences
  if (user.emailSettings?.find(setting => setting.unsubscribed)) {
    console.log(`User ${to} has unsubscribed from emails`);
    return;
  }

  // Render email template with data
  const html = templates[template]({
    name: user.name || 'there',
    ...data
  });

  // Prepare email message
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: 'AI Girlfriend'
    },
    subject,
    html,
    attachments: attachments?.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      type: att.contentType,
      disposition: 'attachment'
    }))
  };

  // Send email with retry logic
  try {
    await pRetry(
      async () => {
        try {
          await sgMail.send(msg);
        } catch (error: any) {
          console.error('SendGrid Error Details:', {
            code: error.code,
            message: error.message,
            response: error.response?.body
          });
          throw error;
        }
        
        // Log email sent to database
        await prisma.emailLog.create({
          data: {
            userId: user.id,
            template,
            subject,
            status: 'SENT',
            metadata: data
          }
        });
      },
      {
        retries: rateLimits.maxRetriesPerEmail,
        onFailedAttempt: (error) => {
          console.error(`Failed to send email to ${to}:`, error);
        }
      }
    );

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    // Log failed email attempt
    await prisma.emailLog.create({
      data: {
        userId: user.id,
        template,
        subject,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: data
      }
    });

    throw error;
  }
} 