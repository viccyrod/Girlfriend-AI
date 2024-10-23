export async function toggleFollowAIModel(modelId: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/follow/${modelId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to toggle follow state for AI model with ID ${modelId}: ${response.statusText}`);
      throw new Error('Failed to toggle follow state');
    }

    const data: { isFollowing: boolean } = await response.json();
    console.log(`Successfully toggled follow state for AI model:`, data);
    return data.isFollowing;
  } catch (error) {
    console.error('Error toggling follow state for AI model:', error);
    throw error;
  }
}
