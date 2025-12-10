#!/usr/bin/env tsx

import { MittwaldAPIV2Client } from '@mittwald/api-client';

async function getCronjobExecutions() {
  // Get API token from environment
  const apiToken = process.env.MITTWALD_API_TOKEN;

  if (!apiToken) {
    console.error('Error: MITTWALD_API_TOKEN environment variable is required');
    process.exit(1);
  }

  // Create client
  const client = MittwaldAPIV2Client.newWithToken(apiToken);

  const cronjobId = 'cron-be78sh';

  try {
    console.log(`Fetching execution history for cronjob: ${cronjobId}\n`);

    // List cronjob executions
    const executions = await client.cronjob.listExecutions({
      cronjobId: cronjobId,
    });

    if (executions.status !== 200) {
      console.error('Failed to fetch executions:', executions.status);
      process.exit(1);
    }

    const executionList = executions.data || [];
    console.log(`Found ${executionList.length} executions\n`);
    console.log('='.repeat(80));

    // Display executions in reverse chronological order (most recent first)
    const sortedExecutions = [...executionList].sort((a, b) => {
      const timeA = new Date(a.start || 0).getTime();
      const timeB = new Date(b.start || 0).getTime();
      return timeB - timeA;
    });

    // Show last 20 executions
    const recentExecutions = sortedExecutions.slice(0, 20);

    for (const execution of recentExecutions) {
      const startTime = execution.start ? new Date(execution.start).toISOString() : 'N/A';
      const endTime = execution.end ? new Date(execution.end).toISOString() : 'N/A';
      const duration = execution.durationInMilliseconds
        ? `${execution.durationInMilliseconds}ms`
        : 'N/A';
      const status = execution.status || 'unknown';
      const exitCode = execution.exitCode !== undefined ? execution.exitCode : 'N/A';

      console.log(`\nExecution ID: ${execution.id}`);
      console.log(`  Status:     ${status}`);
      console.log(`  Start:      ${startTime}`);
      console.log(`  End:        ${endTime}`);
      console.log(`  Duration:   ${duration}`);
      console.log(`  Exit Code:  ${exitCode}`);
      console.log('-'.repeat(80));
    }

    // Get detailed logs for the most recent 3 executions
    console.log('\n\n' + '='.repeat(80));
    console.log('DETAILED LOGS FOR MOST RECENT EXECUTIONS');
    console.log('='.repeat(80));

    for (let i = 0; i < Math.min(3, recentExecutions.length); i++) {
      const execution = recentExecutions[i];
      console.log(`\n\nExecution #${i + 1} - ${execution.id}`);
      console.log(`Status: ${execution.status}, Start: ${execution.start}`);
      console.log('-'.repeat(80));

      try {
        const logs = await client.cronjob.getExecutionLogs({
          executionId: execution.id,
        });

        if (logs.status === 200 && logs.data) {
          console.log('STDOUT:');
          console.log(logs.data.stdout || '(empty)');
          console.log('\nSTDERR:');
          console.log(logs.data.stderr || '(empty)');
        } else {
          console.log('No logs available');
        }
      } catch (error) {
        console.log(`Error fetching logs: ${error}`);
      }
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('Error fetching cronjob executions:', error);
    process.exit(1);
  }
}

getCronjobExecutions();
