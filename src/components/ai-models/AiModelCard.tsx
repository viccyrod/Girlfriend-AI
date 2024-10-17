import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AIModelProps {
  model: {
    id: string;
    name: string;
    personality: string;
    appearance: string;
    backstory: string;
    hobbies: string;
    likes: string;
    dislikes: string;
    imageUrl: string;
    createdBy: {
      name: string;
      image: string;
    };
  };
}

const AIModelCard: React.FC<AIModelProps> = ({ model }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={model.imageUrl} alt={model.name} />
            <AvatarFallback>{model.name[0]}</AvatarFallback>
          </Avatar>
          {model.name}
        </CardTitle>
        <CardDescription>Created by {model.createdBy.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-2"><strong>Personality:</strong> {model.personality}</p>
        <p className="text-sm mb-2"><strong>Appearance:</strong> {model.appearance}</p>
        <p className="text-sm mb-2"><strong>Backstory:</strong> {model.backstory}</p>
        <p className="text-sm mb-2"><strong>Hobbies:</strong> {model.hobbies}</p>
        <p className="text-sm mb-2"><strong>Likes:</strong> {model.likes}</p>
        <p className="text-sm mb-2"><strong>Dislikes:</strong> {model.dislikes}</p>
      </CardContent>
    </Card>
  );
};

export default AIModelCard;
