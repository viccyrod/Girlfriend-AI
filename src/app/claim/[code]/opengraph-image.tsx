import { ImageResponse } from 'next/og';
import prisma from '@/lib/prisma';

export const runtime = 'edge';
export const alt = 'Claim your GOON tokens';
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({ params }: { params: { code: string } }) {
  const claim = await prisma.tokenClaim.findUnique({
    where: { code: params.code }
  });

  const amount = claim?.amount || 1200;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #0f1015, #1a1b23)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <img
          src="https://girlfriend.cx/logo-gradient.svg"
          alt="Girlfriend Logo"
          width={300}
          height={100}
        />
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #a855f7, #ec4899)',
            backgroundClip: 'text',
            color: 'transparent',
            marginTop: 40,
          }}
        >
          {amount.toLocaleString()} GOON Tokens
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#9ca3af',
            marginTop: 20,
          }}
        >
          Are Waiting For You!
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 