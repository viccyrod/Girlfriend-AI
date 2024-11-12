import { Message as MessageType } from "@/types/message";

interface MessageProps {
  message: MessageType;
  isAI: boolean;
}

export const Message = ({ message, isAI }: MessageProps) => {
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[80%] ${isAI ? 'bg-primary/10' : 'bg-primary'} rounded-lg p-4`}>
        <p className={`text-sm ${isAI ? 'text-foreground' : 'text-primary-foreground'}`}>
          {message.content}
        </p>
        <span className="text-xs text-muted-foreground mt-2 block">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}; 