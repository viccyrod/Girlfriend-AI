import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface User {
  id: string;
  name: string;
  image?: string;
}

const SuggestedCreator: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div>
      <div key={user.id} className="flex items-center gap-2 mb-4">
        <Avatar>
          <AvatarImage className='w-10 h-10' src={user.image || "/user-placeholder.png"}/>
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-xs text-zinc-400">@{user.name.toLowerCase().split(' ').join('')}</span>
        </div>
      </div>
    </div>
  )
}

export default SuggestedCreator
