"use client"

import BaseLayout from "../BaseLayout"
import Community from "../../app/community/CommunityContent"

const HomeScreen = () => {
  return (
    <BaseLayout>
      <Community filterIsAnime={false} />
    </BaseLayout>
  )
}

export default HomeScreen
