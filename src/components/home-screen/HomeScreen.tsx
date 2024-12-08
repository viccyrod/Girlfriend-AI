"use client"

import BaseLayout from "../BaseLayout"
import Community from "../../app/community/CommunityContent"

const HomeScreen = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <BaseLayout>
          <Community filterIsAnime={false} />
        </BaseLayout>
      </main>
    </div>
  )
}

export default HomeScreen
