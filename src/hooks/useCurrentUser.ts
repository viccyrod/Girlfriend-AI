import { useEffect, useState } from 'react';
import { User } from '@prisma/client';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch the current user data from your API
    fetch('/api/user/current')
      .then(response => response.json())
      .then(data => setCurrentUser(data))
      .catch(error => console.error('Error fetching current user:', error));
  }, []);

  return currentUser;
}

