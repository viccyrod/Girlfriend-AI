// Function to toggle follow state for an AI model
export async function toggleFollowAIModel(modelId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/follow/${modelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle follow state');
    }
    
    const data = await response.json();
    return data.isFollowing;
  } catch (error) {
    console.error('Error toggling follow state:', error);
    throw error;
  }
}
