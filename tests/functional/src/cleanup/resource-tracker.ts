import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type {
  CleanupRequirement,
  ResourceType,
} from '../use-cases/types.js';

export interface TrackedResource {
  type: ResourceType;
  id: string;
  name?: string;
  creationTool?: string;
  deletionTool?: string;
  createdAt: Date;
  order: number;
}

interface ToolUseRecord {
  id: string;
  name: string;
  createdAt: Date;
}

const CREATION_TOOLS: Record<string, ResourceType> = {
  'project/create': 'project',
  'app/create': 'app',
  'database/mysql/create': 'database',
  'database/redis/create': 'database',
  'domain/create': 'domain',
  'mail/mailbox/create': 'mailbox',
  'cronjob/create': 'cronjob',
  'backup/create': 'backup',
  'container/create': 'container',
  'certificate/create': 'certificate',
  'ssh-key/create': 'ssh-key',
};

export class ResourceTracker {
  private readonly resources: TrackedResource[] = [];

  getAll(): TrackedResource[] {
    return [...this.resources];
  }

  add(resource: TrackedResource): void {
    const alreadyTracked = this.resources.some(
      (entry) => entry.id === resource.id && entry.type === resource.type
    );
    if (alreadyTracked) return;
    this.resources.push(resource);
  }

  reset(): void {
    this.resources.length = 0;
  }

  /**
   * Parse a JSONL session log to collect created resources.
   * Relies on tool_use + tool_result pairs with creation tools.
   */
  async collectFromSessionLog(
    sessionLogPath: string,
    cleanupRequirements: CleanupRequirement[]
  ): Promise<TrackedResource[]> {
    this.reset();

    const fileContents = await readFile(sessionLogPath, 'utf-8');
    const lines = fileContents.split(/\r?\n/).filter(Boolean);

    const toolUses: Map<string, ToolUseRecord> = new Map();
    const toolResults: Map<string, unknown> = new Map();

    lines.forEach((line, index) => {
      const parsed = this.safeParseJson(line);
      if (!parsed) return;

      this.extractToolUses(parsed, index, toolUses);
      this.extractToolResults(parsed, toolResults);
    });

    for (const [toolUseId, record] of toolUses.entries()) {
      const normalizedName = normalizeToolName(record.name);
      const resourceType = CREATION_TOOLS[normalizedName];
      if (!resourceType) continue;

      const resultPayload = toolResults.get(toolUseId);
      const resourceId = this.extractResourceId(normalizedName, resultPayload);
      if (!resourceId) continue;

      const requirement = cleanupRequirements.find((req) => req.resourceType === resourceType);
      this.add({
        type: resourceType,
        id: resourceId,
        name: basename(resourceId),
        creationTool: normalizedName,
        deletionTool: requirement?.deletionTool,
        createdAt: record.createdAt,
        order: requirement?.order ?? DEFAULT_DELETION_PRIORITY,
      });
    }

    // Preserve creation order for deterministic cleanup staging
    return this.getAll().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  private safeParseJson(line: string): Record<string, unknown> | null {
    if (!line.trim()) return null;
    try {
      return JSON.parse(line) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private extractToolUses(
    parsed: Record<string, unknown>,
    index: number,
    toolUses: Map<string, ToolUseRecord>
  ): void {
    // Stream JSON tool_use event
    if (parsed.type === 'tool_use' && typeof parsed.name === 'string' && typeof parsed.id === 'string') {
      toolUses.set(parsed.id, { id: parsed.id, name: parsed.name, createdAt: new Date(index) });
      return;
    }

    // Assistant message containing tool_use content blocks
    const message = parsed.message as Record<string, unknown> | undefined;
    const content = Array.isArray(message?.content) ? message?.content : [];
    for (const block of content as Array<Record<string, unknown>>) {
      if (block.type === 'tool_use' && typeof block.id === 'string' && typeof block.name === 'string') {
        toolUses.set(block.id, { id: block.id, name: block.name, createdAt: new Date(index) });
      }
    }
  }

  private extractToolResults(
    parsed: Record<string, unknown>,
    toolResults: Map<string, unknown>
  ): void {
    if (parsed.type !== 'tool_result') {
      return;
    }

    const toolUseId = typeof parsed.tool_use_id === 'string' ? parsed.tool_use_id : undefined;
    if (!toolUseId) return;

    const content = (parsed.content ?? parsed.result ?? parsed.output) as unknown;
    if (content !== undefined) {
      toolResults.set(toolUseId, content);
    }
  }

  private extractResourceId(toolName: string, rawResult: unknown): string | null {
    if (!rawResult) return null;

    const payload = normalizeResult(rawResult);
    if (!payload) return null;

    const candidates: Array<string | undefined> = [
      payload.id,
      payload.resourceId,
      payload.projectId,
      payload.appId,
      payload.databaseId,
      payload.domainId,
      payload.mailboxId,
      payload.containerId,
      payload.certificateId,
      payload.sshKeyId,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }

    // Tool-specific nested shapes
    if (toolName.includes('project') && typeof payload.project === 'object' && payload.project) {
      const project = payload.project as Record<string, unknown>;
      if (typeof project.id === 'string') return project.id;
    }

    return null;
  }
}

const DEFAULT_DELETION_PRIORITY = 10;

function normalizeToolName(name: string): string {
  return name.replace(/^mcp__[^_]+__/, '');
}

function normalizeResult(raw: unknown): Record<string, any> | null {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  if (Array.isArray(raw)) {
    const text = raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item && 'text' in item) {
          const maybeText = (item as Record<string, unknown>).text;
          return typeof maybeText === 'string' ? maybeText : '';
        }
        return '';
      })
      .join('');

    if (text.trim()) {
      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }

  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }

  return null;
}
