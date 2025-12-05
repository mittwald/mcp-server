import type {
  CleanupRequirement,
  CleanupStatus,
  DeletedResource,
  FailedResource,
  ResourceType,
} from '../use-cases/types.js';
import type { TrackedResource } from './resource-tracker.js';

export type DeletionInvoker = (resource: TrackedResource) => Promise<{ success: boolean; error?: string }>;

const DEPENDENCY_ORDER: ResourceType[] = [
  'mailbox',
  'domain',
  'cronjob',
  'backup',
  'database',
  'container',
  'app',
  'project',
  'ssh-key',
  'certificate',
];

export class CleanupExecutor {
  constructor(private readonly deleteResource: DeletionInvoker) {}

  async cleanup(resources: TrackedResource[], requirements: CleanupRequirement[]): Promise<CleanupStatus> {
    const deleted: DeletedResource[] = [];
    const failed: FailedResource[] = [];

    const sorted = this.sortResources(resources, requirements);

    for (const resource of sorted) {
      const deletionTool = resource.deletionTool ?? this.lookupDeletionTool(resource.type, requirements);
      if (!deletionTool) {
        failed.push({
          type: resource.type,
          id: resource.id,
          tool: 'unknown',
          error: 'No deletion tool configured',
        });
        continue;
      }

      const result = await this.deleteResource({ ...resource, deletionTool });
      if (result.success) {
        deleted.push({ type: resource.type, id: resource.id, tool: deletionTool });
      } else {
        failed.push({
          type: resource.type,
          id: resource.id,
          tool: deletionTool,
          error: result.error ?? 'Unknown deletion failure',
        });
      }
    }

    return {
      status: this.summarizeStatus(deleted.length, failed.length, resources.length),
      deleted,
      failed,
    };
  }

  private sortResources(resources: TrackedResource[], requirements: CleanupRequirement[]): TrackedResource[] {
    const priority = new Map<ResourceType, number>();
    requirements.forEach((req) => priority.set(req.resourceType, req.order));

    return [...resources].sort((a, b) => {
      const orderA = priority.get(a.type) ?? defaultPriority(a.type);
      const orderB = priority.get(b.type) ?? defaultPriority(b.type);
      if (orderA !== orderB) return orderA - orderB;

      // Within the same order bucket delete newest first to unwind dependencies
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  private summarizeStatus(deletedCount: number, failedCount: number, total: number): CleanupStatus['status'] {
    if (failedCount === 0) return 'complete';
    if (deletedCount === 0) return 'failed';
    if (deletedCount + failedCount >= total) return 'partial';
    return 'partial';
  }

  private lookupDeletionTool(type: ResourceType, requirements: CleanupRequirement[]): string | undefined {
    return requirements.find((req) => req.resourceType === type)?.deletionTool;
  }
}

function defaultPriority(type: ResourceType): number {
  const index = DEPENDENCY_ORDER.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
