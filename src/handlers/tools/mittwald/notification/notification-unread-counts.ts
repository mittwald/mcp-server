import type { 
  MittwaldToolHandler
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';
import type { NotificationUnreadCountsArgs } from '../../../../types/mittwald/notification.js';

export const handleMittwaldNotificationUnreadCounts: MittwaldToolHandler<NotificationUnreadCountsArgs> = async (_args, { mittwaldClient }) => {
  try {
    const response = await mittwaldClient.api.notification.scountUnreadNotifications({});

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully retrieved unread notification counts",
      result: {
        unreadCounts: response.data
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to get unread notification counts: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};