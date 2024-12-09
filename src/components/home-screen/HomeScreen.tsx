"use client"

import dynamic from 'next/dynamic'
import BaseLayout from "../BaseLayout"
import Footer from '../footer'

// Pre-load the Community component with priority
const Community = dynamic(() => import("../community/CommunityContent"), {
  ssr: true,
  loading: () => (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-8 bg-gray-800/50 rounded w-2/3" />
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-gray-800/50 rounded-xl" />
        ))}
      </div>
    </div>
  ),
  suspense: true
})

const HomeScreen = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-safe">
        <BaseLayout>
          <Community initialModels={[]} />
        </BaseLayout>
      </div>
    </div>
  )
}

export default HomeScreen
