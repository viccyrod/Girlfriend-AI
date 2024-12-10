import prisma from '@/lib/prisma';

export async function generateMetadata({ params }: { params: { code: string } }) {
  const claim = await prisma.tokenClaim.findUnique({
    where: { code: params.code }
  });

  const amount = claim?.amount || 1800;
  const title = `Claim ${amount.toLocaleString()} GOON Tokens | Girlfriend.cx`;
  const description = `You've been gifted ${amount.toLocaleString()} GOON tokens! Create your account on girlfriend.cx to claim them and start chatting with AI characters.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/claim/${params.code}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/claim/${params.code}/opengraph-image`],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
} 