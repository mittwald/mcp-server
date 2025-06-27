import type { 
  MittwaldToolHandler
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';
import type { NotificationMarkAllReadArgs } from '../../../../types/mittwald/notification.js';

export const handleMittwaldNotificationMarkAllRead: MittwaldToolHandler<NotificationMarkAllReadArgs> = async (args, { mittwaldClient }) => {
  try {
    const { severities, referenceId, referenceAggregate, referenceDomain } = args;

    const queryParams: any = {};
    if (severities) queryParams.severities = severities;
    if (referenceId) queryParams.referenceId = referenceId;
    if (referenceAggregate) queryParams.referenceAggregate = referenceAggregate;
    if (referenceDomain) queryParams.referenceDomain = referenceDomain;

    const response = await mittwaldClient.api.notification.sreadAllNotifications({
      queryParameters: queryParams
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully marked all notifications as read",
      result: {
        success: true,
        filtersApplied: {
          severities,
          referenceId,
          referenceAggregate,
          referenceDomain
        }
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to mark all notifications as read: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};