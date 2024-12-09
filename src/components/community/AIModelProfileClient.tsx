"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle } from "lucide-react";

interface AIModelProfileClientProps {
  model: any;
  onStartChat: () => void;
  onFollow: () => void;
  isFollowing: boolean;
}

export function AIModelProfileClient({ 
  model, 
  onStartChat, 
  onFollow, 
  isFollowing 
}: AIModelProfileClientProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-4"
    >
      {/* Hero Section */}
      <div className="relative h-64 rounded-2xl overflow-hidden mb-16 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="absolute -bottom-12 left-8">
          <Avatar className="w-32 h-32 border-4 border-background">
            <img src={model.imageUrl} alt={model.name} className="object-cover" />
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{model.name}</h1>
            <p className="text-muted-foreground">{model.followerCount || 0} followers</p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={onStartChat}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
            <Button 
              variant={isFollowing ? "secondary" : "outline"}
              onClick={onFollow}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current text-red-500" : ""}`} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-primary/5">
            <h3 className="text-lg font-semibold mb-3">Personality</h3>
            <p className="text-muted-foreground">{model.personality}</p>
          </Card>
          <Card className="p-6 bg-primary/5">
            <h3 className="text-lg font-semibold mb-3">Appearance</h3>
            <p className="text-muted-foreground">{model.appearance}</p>
          </Card>
          <Card className="p-6 bg-primary/5">
            <h3 className="text-lg font-semibold mb-3">Backstory</h3>
            <p className="text-muted-foreground">{model.backstory}</p>
          </Card>
          <Card className="p-6 bg-primary/5">
            <h3 className="text-lg font-semibold mb-3">Hobbies</h3>
            <p className="text-muted-foreground">{model.hobbies}</p>
          </Card>
        </div>

        {/* Likes & Dislikes */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Likes</h3>
            <div className="flex flex-wrap gap-2">
              {model.likes?.split(',').map((like: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-green-500/10 text-green-400">
                  {like.trim()}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Dislikes</h3>
            <div className="flex flex-wrap gap-2">
              {model.dislikes?.split(',').map((dislike: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-red-500/10 text-red-400">
                  {dislike.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 