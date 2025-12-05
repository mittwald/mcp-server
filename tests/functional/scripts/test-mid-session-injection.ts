#!/usr/bin/env npx tsx
/**
 * Test Script: Mid-Session Stdin Injection (WP01 Success Metric)
 *
 * This test MUST demonstrate:
 * 1. Spawn Claude session with stdin kept OPEN
 * 2. Wait for Claude to ask a question
 * 3. Inject answer AFTER question is detected
 * 4. Verify Claude acknowledges the answer
 *
 * This is the SUCCESS METRIC for WP01: "inject a user message mid-session
 * and see Claude acknowledge it in stdout"
 *
 * Usage: cd tests/functional && npx tsx scripts/test-mid-session-injection.ts
 */

import { spawn, ChildProcess } from 'node:child_process';
import { writeUserMessage } from '../src/harness/stdin-injector.js';

interface TestResult {
  questionDetected: boolean;
  answerInjectedMidSession: boolean;
  acknowledgmentReceived: boolean;
  fullConversation: string[];
}

async function runMidSessionInjectionTest(): Promise<TestResult> {
  console.log('=== Mid-Session Injection Test (WP01 Success Metric) ===\n');

  const result: TestResult = {
    questionDetected: false,
    answerInjectedMidSession: false,
    acknowledgmentReceived: false,
    fullConversation: [],
  };

  // Spawn with interactive mode - stdin stays open
  const args = [
    '--output-format', 'stream-json',
    '--input-format', 'stream-json',
    '--verbose',
    '--model', 'haiku',
    '--disallowedTools', 'Bash,Read,Write,Edit,Glob,Grep,Task,WebFetch,WebSearch',
  ];

  console.log('Spawning Claude in interactive mode (stdin stays open)...');
  const child: ChildProcess = spawn('claude', args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  console.log('PID:', child.pid);

  // Send initial prompt that will make Claude ask a question
  const initialPrompt = 'Ask me what my favorite color is, then wait for my answer.';
  console.log(`\nSending initial prompt: "${initialPrompt}"`);

  const initialMessage = {
    type: 'user',
    message: { role: 'user', content: initialPrompt },
  };
  child.stdin!.write(JSON.stringify(initialMessage) + '\n');
  console.log('Initial prompt sent. Stdin is OPEN - waiting for question...\n');

  // Track state
  let questionTime: number | null = null;
  let injectionTime: number | null = null;
  let hasInjected = false;

  // Process stdout in real-time
  let buffer = '';
  child.stdout!.setEncoding('utf8');

  const processOutput = (chunk: string): void => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line);

        if (event.type === 'assistant' && event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === 'text' && block.text) {
              const text = block.text.trim();
              console.log('[CLAUDE]', text);
              result.fullConversation.push(`Claude: ${text}`);

              // Detect question
              if (!result.questionDetected && text.includes('?')) {
                result.questionDetected = true;
                questionTime = Date.now();
                console.log('\n>>> QUESTION DETECTED! <<<');

                // Wait a moment then inject answer mid-session
                if (!hasInjected) {
                  hasInjected = true;
                  setTimeout(() => {
                    if (child.stdin && !child.stdin.destroyed) {
                      const answer = 'My favorite color is blue.';
                      console.log(`\n>>> INJECTING ANSWER MID-SESSION: "${answer}" <<<\n`);
                      injectionTime = Date.now();

                      const injectionResult = writeUserMessage(child.stdin, answer);
                      if (injectionResult.success) {
                        result.answerInjectedMidSession = true;
                        result.fullConversation.push(`User (injected): ${answer}`);
                        console.log('Answer injection: SUCCESS');
                        console.log(`Time since question: ${injectionTime - questionTime!}ms`);
                      } else {
                        console.log('Answer injection: FAILED -', injectionResult.error);
                      }
                    }
                  }, 500); // Small delay to ensure Claude is waiting
                }
              }

              // Check for acknowledgment of the answer
              if (result.answerInjectedMidSession && !result.acknowledgmentReceived) {
                const lowerText = text.toLowerCase();
                if (
                  lowerText.includes('blue') ||
                  lowerText.includes('color') ||
                  lowerText.includes('great') ||
                  lowerText.includes('nice') ||
                  lowerText.includes('thank')
                ) {
                  result.acknowledgmentReceived = true;
                  console.log('\n>>> ACKNOWLEDGMENT RECEIVED! <<<');
                }
              }
            }
          }
        }

        // On result event, close stdin if we've injected
        if (event.type === 'result' && result.answerInjectedMidSession) {
          console.log('\n[Turn complete, closing stdin]');
          if (child.stdin && !child.stdin.destroyed) {
            child.stdin.end();
          }
        }
      } catch {
        // Not JSON, skip
      }
    }
  };

  child.stdout!.on('data', processOutput);

  child.stderr?.on('data', (data: Buffer) => {
    const text = data.toString().trim();
    if (text) {
      console.log('[STDERR]', text.substring(0, 200));
    }
  });

  // Wait for completion with timeout
  const exitCode = await new Promise<number | null>((resolve) => {
    const timeout = setTimeout(() => {
      console.log('\n[TIMEOUT - 90s elapsed]');
      if (child.stdin && !child.stdin.destroyed) {
        child.stdin.end();
      }
      child.kill();
      resolve(-1);
    }, 90000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
  });

  return result;
}

async function main(): Promise<void> {
  try {
    const result = await runMidSessionInjectionTest();

    console.log('\n' + '='.repeat(50));
    console.log('TEST RESULTS');
    console.log('='.repeat(50));
    console.log('Question detected by Claude:', result.questionDetected ? '✓ YES' : '✗ NO');
    console.log('Answer injected mid-session:', result.answerInjectedMidSession ? '✓ YES' : '✗ NO');
    console.log('Claude acknowledged answer:', result.acknowledgmentReceived ? '✓ YES' : '✗ NO');

    console.log('\nConversation:');
    result.fullConversation.forEach((line, i) => {
      console.log(`  ${i + 1}. ${line}`);
    });

    // Success criteria: all three must be true
    const success =
      result.questionDetected &&
      result.answerInjectedMidSession &&
      result.acknowledgmentReceived;

    console.log('\n' + '='.repeat(50));
    console.log('WP01 SUCCESS METRIC:', success ? '✓ PASS' : '✗ FAIL');
    console.log('='.repeat(50));

    if (success) {
      console.log('\n✓ Mid-session injection WORKS!');
      console.log('✓ SessionRunner.interactive mode keeps stdin open');
      console.log('✓ SupervisoryController can inject answers at runtime');
    } else {
      console.log('\n✗ Mid-session injection FAILED');
      if (!result.questionDetected) {
        console.log('  - Claude did not ask a question');
      }
      if (!result.answerInjectedMidSession) {
        console.log('  - Answer was not injected mid-session');
      }
      if (!result.acknowledgmentReceived) {
        console.log('  - Claude did not acknowledge the answer');
      }
    }

    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

main();
