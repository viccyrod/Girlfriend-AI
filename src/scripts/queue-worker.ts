import('node-fetch').then(({ default: fetch }) => {
  // Get the worker endpoint from environment variables
  const WORKER_ENDPOINT = process.env.WORKER_ENDPOINT || 'http://localhost:3000/api/ai-models/worker';
  const POLL_INTERVAL = parseInt(process.env.QUEUE_POLL_INTERVAL || '5000'); // 5 seconds
  const RETRY_INTERVAL = parseInt(process.env.QUEUE_RETRY_INTERVAL || '10000'); // 10 seconds
  const MAX_RETRIES = parseInt(process.env.QUEUE_MAX_RETRIES || '3');

  let retryCount = 0;

  interface WorkerResponse {
    jobId?: string;
    message?: string;
    error?: string;
  }

  async function processQueue() {
    try {
      console.log(`[${new Date().toISOString()}] Checking for queued jobs...`);
      
      const response = await fetch(WORKER_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
          ...(process.env.WORKER_AUTH_TOKEN && {
            'Authorization': `Bearer ${process.env.WORKER_AUTH_TOKEN}`
          })
        }
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      const result = JSON.parse(responseText) as WorkerResponse;
      
      if (result.jobId) {
        console.log(`[${new Date().toISOString()}] Processed job ${result.jobId}`);
        retryCount = 0; // Reset retry count on successful processing
      } else {
        console.log(`[${new Date().toISOString()}] No jobs to process`);
      }

      // Schedule next check
      setTimeout(processQueue, POLL_INTERVAL);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error processing queue:`, error);

      if (error instanceof Error && 
          (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch'))) {
        retryCount++;
        
        if (retryCount > MAX_RETRIES) {
          console.error(`[${new Date().toISOString()}] Max retries (${MAX_RETRIES}) exceeded. Stopping worker.`);
          process.exit(1);
        }

        console.log(`[${new Date().toISOString()}] Connection failed. Retry ${retryCount}/${MAX_RETRIES} in ${RETRY_INTERVAL}ms`);
        setTimeout(processQueue, RETRY_INTERVAL);
      } else {
        // For other errors, continue polling but log the error
        setTimeout(processQueue, POLL_INTERVAL);
      }
    }
  }

  // Start processing
  console.log(`[${new Date().toISOString()}] Starting queue worker...`);
  console.log(`Worker endpoint: ${WORKER_ENDPOINT}`);
  processQueue();
}); 