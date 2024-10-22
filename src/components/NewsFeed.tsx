import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { Post, User } from '@prisma/client'; // Ensure this path is correct

// Update the PostWithAuthor type
type PostWithAuthor = {
  id: string;
  content: string;
  createdAt: Date;
  author: User;
};

const NewsFeed = () => {
  const { data: posts, isLoading, error } = useQuery<PostWithAuthor[]>({
    queryKey: ['newsFeed'],
    queryFn: async () => {
      const response = await fetch('/api/chat/news-feed');
      if (!response.ok) {
        throw new Error('Failed to fetch news feed');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading news feed. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">News Feed</h1>
      <div className="space-y-6">
        {posts?.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={post.author.image || ''} alt={post.author.name} />
                  <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                </Avatar>
                <CardTitle>{post.author.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p>{post.content}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
