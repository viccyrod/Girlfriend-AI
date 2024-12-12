import { Metadata } from "next";

type Props = {
  params: { code: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Claim 1800 GOON Tokens on Girlfriend.cx!',
    description: 'Join thousands of users exploring intimate connections with AI companions. Get 1,200 tokens on signup plus 600 bonus tokens with referral!',
    openGraph: {
      title: 'Claim 1800 GOON Tokens on Girlfriend.cx!',
      description: 'Join thousands of users exploring intimate connections with AI companions. Get 1,200 tokens on signup plus 600 bonus tokens with referral!'
    }
  }
}

export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
} 