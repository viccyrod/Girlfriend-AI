import('node-fetch').then(({ default: fetch }) => {
  // Get the worker endpoint from environment variables
  const WORKER_ENDPOINT = process.env.WORKER_ENDPOINT || 'http://localhost:3000/api/ai-models/worker';
  const MIN_POLL_INTERVAL = parseInt(process.env.QUEUE_MIN_POLL_INTERVAL || '10000'); // 10 seconds minimum
  const MAX_POLL_INTERVAL = parseInt(process.env.QUEUE_MAX_POLL_INTERVAL || '60000'); // 1 minute maximum
  const RETRY_INTERVAL = parseInt(process.env.QUEUE_RETRY_INTERVAL || '30000'); // 30 seconds
  const MAX_RETRIES = parseInt(process.env.QUEUE_MAX_RETRIES || '3');

  let retryCount = 0;
  let currentPollInterval = MIN_POLL_INTERVAL;
  let lastProcessedTime = Date.now();

  interface WorkerResponse {
    jobId?: string;
    message?: string;
    error?: string;
  }

  // Dynamic polling interval based on queue activity
  function adjustPollInterval(hasJobs: boolean) {
    const timeSinceLastJob = Date.now() - lastProcessedTime;

    if (hasJobs) {
      // If we're processing jobs, decrease interval but not below minimum
      currentPollInterval = Math.max(MIN_POLL_INTERVAL, currentPollInterval / 2);
      lastProcessedTime = Date.now();
    } else if (timeSinceLastJob > 60000) { // No jobs for 1 minute
      // If queue is idle, gradually increase interval but not above maximum
      currentPollInterval = Math.min(MAX_POLL_INTERVAL, currentPollInterval * 1.5);
    }

    return currentPollInterval;
  }

  async function processQueue() {
    try {
      console.log(`[${new Date().toISOString()}] Checking for queued jobs...`);
      
      const response = await fetch(WORKER_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
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
      
      const hasJobs = !!result.jobId;
      if (hasJobs) {
        console.log(`[${new Date().toISOString()}] Processed job ${result.jobId}`);
        retryCount = 0; // Reset retry count on successful processing
      } else {
        console.log(`[${new Date().toISOString()}] No jobs to process`);
      }

      // Adjust polling interval based on queue activity
      const nextPollInterval = adjustPollInterval(hasJobs);
      setTimeout(processQueue, nextPollInterval);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error processing queue:`, error);

      if (error instanceof Error && 
          (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch'))) {
        retryCount++;
        
        if (retryCount > MAX_RETRIES) {
          console.error(`[${new Date().toISOString()}] Max retries (${MAX_RETRIES}) exceeded. Stopping worker.`);
          process.exit(1);
        }

        const backoffDelay = Math.min(RETRY_INTERVAL * Math.pow(2, retryCount - 1), MAX_POLL_INTERVAL);
        console.log(`[${new Date().toISOString()}] Connection failed. Retry ${retryCount}/${MAX_RETRIES} in ${backoffDelay}ms`);
        setTimeout(processQueue, backoffDelay);
      } else {
        // For other errors, continue polling with current interval
        setTimeout(processQueue, currentPollInterval);
      }
    }
  }

  // Start processing
  console.log(`[${new Date().toISOString()}] Starting queue worker...`);
  console.log(`Worker endpoint: ${WORKER_ENDPOINT}`);
  console.log(`Initial poll interval: ${MIN_POLL_INTERVAL}ms`);
  processQueue();
}); 