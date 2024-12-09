'use client';

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import BaseLayout from '@/components/BaseLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function ProfileSettings() {
  const { user } = useKindeBrowserClient();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <BaseLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
          Profile Settings
        </h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information and manage your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.picture || ""} />
                  <AvatarFallback className="text-lg">
                    {user?.given_name?.[0]}{user?.family_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                  Change Avatar
                </Button>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    defaultValue={`${user?.given_name || ''} ${user?.family_name || ''}`}
                    className="bg-gray-800/50 border-gray-700"
                    disabled={!isEditing}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ''}
                    className="bg-gray-800/50 border-gray-700"
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    defaultValue={user?.given_name?.toLowerCase() || ''}
                    className="bg-gray-800/50 border-gray-700"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                {isEditing && (
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    Save Changes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Settings Card */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences and settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Preferences</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="marketing" className="rounded border-gray-700 bg-gray-800" />
                    <Label htmlFor="marketing">Receive marketing emails</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="updates" className="rounded border-gray-700 bg-gray-800" />
                    <Label htmlFor="updates">Receive product updates</Label>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="pt-4 border-t border-gray-800">
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BaseLayout>
  );
} 