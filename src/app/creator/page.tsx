"use client"

import BaseLayout from '@/components/BaseLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'
import dynamic from 'next/dynamic';
import { CldUploadWidget } from "next-cloudinary"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const ContentTab = dynamic(() => import('./Content/ContentTab'), {
  loading: () => <p>Loading...</p>,
});

function CreatorPage() {
  const { isAuthenticated, isLoading } = useKindeBrowserClient();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BaseLayout renderRightPanel={false}> 
      {isAuthenticated ? (
        <>
          <Tabs defaultValue="content" className="w-full mx-auto my-10 px-2 md:px-10">
            <TabsList className="flex flex-col md:flex-row w-full md:w-3/4 mx-auto h-auto">
              <TabsTrigger value="content" className="w-full md:w-auto">Content</TabsTrigger>
              <TabsTrigger value="analytics" className="w-full md:w-auto">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <ContentTab />  
            </TabsContent>
            <TabsContent value="analytics">Change your password here.</TabsContent>
          </Tabs>

          <CldUploadWidget 
            uploadPreset="ml_default"
            onUpload={(result, widget) => {
              console.log(result, widget);
            }}
          >
            {({ open }) => {
              function handleOnClick(e: React.MouseEvent<HTMLButtonElement>) {
                e.preventDefault();
                open();
              }
              return (
                <button onClick={handleOnClick}>
                  Upload an Image
                </button>
              );
            }}
          </CldUploadWidget>
        </>
      ) : (
        <div>Please log in to access this page.</div>
      )}
    </BaseLayout>
  )
}

export default CreatorPage
