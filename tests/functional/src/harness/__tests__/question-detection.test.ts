/**
 * Question Detection Tests (T010)
 *
 * Tests for the question detection functionality in StreamParser.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectQuestion,
  QUESTION_PATTERNS,
  StreamParser,
  type QuestionDetectedEvent,
} from '../stream-parser.js';

describe('QUESTION_PATTERNS', () => {
  it('has patterns defined', () => {
    expect(QUESTION_PATTERNS).toBeDefined();
    expect(QUESTION_PATTERNS.length).toBeGreaterThan(0);
  });
});

describe('detectQuestion', () => {
  describe('direct questions ending with ?', () => {
    it('detects simple questions', () => {
      expect(detectQuestion('What is your name?')).toBe(true);
    });

    it('detects questions with trailing whitespace', () => {
      expect(detectQuestion('What is your name?  ')).toBe(true);
    });

    it('detects multi-line text with question at end', () => {
      expect(detectQuestion('I can help you.\nWhat would you like to do?')).toBe(true);
    });

    it('does not match ? in middle of sentence', () => {
      // This tests the end-of-line anchor behavior
      expect(detectQuestion('The file contains ? characters and more text')).toBe(false);
    });
  });

  describe('permission/confirmation patterns', () => {
    it('detects "Could you" phrases', () => {
      expect(detectQuestion('Could you provide more details?')).toBe(true);
      expect(detectQuestion('Could you clarify what you mean')).toBe(true);
    });

    it('detects "Would you like" phrases', () => {
      expect(detectQuestion('Would you like me to proceed?')).toBe(true);
      expect(detectQuestion('Would you like to continue')).toBe(true);
    });

    it('detects "Please confirm/provide/specify" phrases', () => {
      expect(detectQuestion('Please confirm the file path')).toBe(true);
      expect(detectQuestion('Please provide your API key')).toBe(true);
      expect(detectQuestion('Please specify the directory')).toBe(true);
      expect(detectQuestion('Please choose an option')).toBe(true);
      expect(detectQuestion('Please select a database')).toBe(true);
    });

    it('detects "Shall I" phrases', () => {
      expect(detectQuestion('Shall I continue with the deployment?')).toBe(true);
    });

    it('detects "Should I" phrases', () => {
      expect(detectQuestion('Should I create the file?')).toBe(true);
    });

    it('detects "Do you want" phrases', () => {
      expect(detectQuestion('Do you want me to proceed?')).toBe(true);
    });

    it('detects "What would you prefer" phrases', () => {
      expect(detectQuestion('What would you prefer for the database name?')).toBe(true);
    });

    it('detects "Which one/option" phrases', () => {
      expect(detectQuestion('Which one should I use?')).toBe(true);
      expect(detectQuestion('Which option do you prefer?')).toBe(true);
    });

    it('detects "What X would you like" phrases', () => {
      expect(detectQuestion('What name would you like for the project?')).toBe(true);
    });

    it('detects "let me know" phrases', () => {
      expect(detectQuestion('Let me know if you need anything else')).toBe(true);
    });
  });

  describe('false positive avoidance', () => {
    it('ignores statements without question patterns', () => {
      expect(detectQuestion('I will create the file. Ready.')).toBe(false);
    });

    it('ignores code examples with question marks in strings', () => {
      // The ? in this code example is not at end of line
      expect(detectQuestion('The regex pattern is /test\\?query/')).toBe(false);
    });

    it('ignores explanations that mention questions', () => {
      expect(detectQuestion('This answers the question of how to proceed.')).toBe(false);
    });

    it('ignores URLs with query parameters', () => {
      expect(detectQuestion('Visit https://example.com/path with parameters')).toBe(false);
    });

    it('ignores simple statements', () => {
      expect(detectQuestion('The deployment completed successfully.')).toBe(false);
      expect(detectQuestion('I have created the file for you.')).toBe(false);
    });
  });

  describe('case insensitivity', () => {
    it('matches regardless of case', () => {
      expect(detectQuestion('COULD YOU help me')).toBe(true);
      expect(detectQuestion('WOULD YOU LIKE to proceed')).toBe(true);
      expect(detectQuestion('SHALL I continue')).toBe(true);
    });
  });

  describe('word boundary matching', () => {
    it('does not match partial words', () => {
      // "should" is part of "shouldn't" - but our pattern looks for "should i"
      expect(detectQuestion("You shouldn't do that.")).toBe(false);
    });
  });
});

describe('StreamParser question detection', () => {
  let parser: StreamParser;

  beforeEach(() => {
    parser = new StreamParser();
  });

  describe('pending question state', () => {
    it('starts with no pending question', () => {
      expect(parser.hasPendingQuestion()).toBe(false);
      expect(parser.getPendingQuestion()).toBeNull();
    });

    it('sets pending question when question is detected in assistant message', () => {
      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'assistant',
          text: 'What would you like me to do?',
        },
      });

      expect(parser.hasPendingQuestion()).toBe(true);
      expect(parser.getPendingQuestion()).toBe('What would you like me to do?');
    });

    it('clears pending question when user message is received', () => {
      // First, set up a pending question
      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'assistant',
          text: 'What would you like me to do?',
        },
      });
      expect(parser.hasPendingQuestion()).toBe(true);

      // User responds
      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'user',
          text: 'Please continue',
        },
      });

      expect(parser.hasPendingQuestion()).toBe(false);
      expect(parser.getPendingQuestion()).toBeNull();
    });

    it('clears pending question on reset', () => {
      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'assistant',
          text: 'What would you like me to do?',
        },
      });
      expect(parser.hasPendingQuestion()).toBe(true);

      parser.reset();

      expect(parser.hasPendingQuestion()).toBe(false);
    });

    it('clearPendingQuestion method works', () => {
      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'assistant',
          text: 'What would you like me to do?',
        },
      });

      parser.clearPendingQuestion();

      expect(parser.hasPendingQuestion()).toBe(false);
    });
  });

  describe('question_detected event emission', () => {
    it('emits question_detected event when question is found', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'assistant',
          text: 'Would you like me to proceed?',
        },
      });

      expect(eventHandler).toHaveBeenCalledTimes(1);
      const event = eventHandler.mock.calls[0][0] as QuestionDetectedEvent;
      expect(event.type).toBe('question_detected');
      expect(event.messageContent).toBe('Would you like me to proceed?');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('does not emit event for non-question messages', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'assistant',
          text: 'I have completed the task.',
        },
      });

      expect(eventHandler).not.toHaveBeenCalled();
    });

    it('does not emit event for user messages', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'user',
          text: 'What is the status?',
        },
      });

      expect(eventHandler).not.toHaveBeenCalled();
    });

    it('includes assistantMessageId if present', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          id: 'msg_123',
          role: 'assistant',
          text: 'Should I proceed?',
        },
      });

      const event = eventHandler.mock.calls[0][0] as QuestionDetectedEvent;
      expect(event.assistantMessageId).toBe('msg_123');
    });
  });

  describe('message content extraction', () => {
    it('extracts text from direct text field', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          text: 'What should I do?',
        },
      });

      expect(eventHandler).toHaveBeenCalled();
    });

    it('extracts text from nested message.content string', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          message: {
            role: 'assistant',
            content: 'Would you like me to help?',
          },
        },
      });

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as QuestionDetectedEvent;
      expect(event.messageContent).toBe('Would you like me to help?');
    });

    it('extracts text from nested message.content array', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Here is some info.' },
              { type: 'text', text: 'Do you want more?' },
            ],
          },
        },
      });

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as QuestionDetectedEvent;
      expect(event.messageContent).toContain('Do you want more?');
    });

    it('extracts text from content field', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          content: 'Could you clarify?',
        },
      });

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe('role extraction', () => {
    it('identifies user role from direct field', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          role: 'user',
          text: 'What is this?',
        },
      });

      // User messages should not trigger question detection
      expect(eventHandler).not.toHaveBeenCalled();
    });

    it('identifies user role from nested message', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          message: {
            role: 'user',
            content: 'What is this?',
          },
        },
      });

      expect(eventHandler).not.toHaveBeenCalled();
    });

    it('defaults to assistant for messages without role', () => {
      const eventHandler = vi.fn();
      parser.on('question_detected', eventHandler);

      parser.processEvent({
        type: 'message',
        timestamp: new Date(),
        content: {
          text: 'Should I proceed?',
        },
      });

      // Should be treated as assistant message
      expect(eventHandler).toHaveBeenCalled();
    });
  });
});
