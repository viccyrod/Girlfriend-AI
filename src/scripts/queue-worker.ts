import('node-fetch').then(({ default: fetch }) => {
  const WORKER_ENDPOINT = process.env.WORKER_ENDPOINT || 'http://localhost:3000/api/ai-models/worker';
  const POLL_INTERVAL = 5000; // 5 seconds
  const RETRY_INTERVAL = 10000; // 10 seconds for connection errors
  const MAX_CONCURRENT_JOBS = 1; // Process one job at a time

  interface WorkerResponse {
    jobId?: string;
    message?: string;
    error?: string;
  }

  async function processQueue() {
    try {
      console.log('Checking for queued jobs...');
      console.log('Endpoint:', WORKER_ENDPOINT);
      
      const response = await fetch(WORKER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText) as WorkerResponse;
      
      if (result.jobId) {
        console.log(`Processed job ${result.jobId}`);
      } else {
        console.log('No jobs to process');
      }

      // Schedule next check
      setTimeout(processQueue, POLL_INTERVAL);

    } catch (error) {
      if (error instanceof Error && 
          (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch'))) {
        console.log('Next.js server not running or still starting. Retrying in 10 seconds...');
        setTimeout(processQueue, RETRY_INTERVAL);
      } else {
        console.error('Error processing queue:', error);
        setTimeout(processQueue, POLL_INTERVAL);
      }
    }
  }

  // Start processing
  console.log('Starting queue worker...');
  console.log('Make sure your Next.js server is running (npm run dev)');
  processQueue();
}); 