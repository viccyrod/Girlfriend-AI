import React from 'react';
import BaseLayout from "@/components/BaseLayout";
import CommunityContent from "./CommunityContent";


export default function CommunityPage() {
  return (
    <BaseLayout>
      <CommunityContent filterIsAnime={false} />
    </BaseLayout>
  );
}
