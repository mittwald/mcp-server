import type { 
  MittwaldToolHandler
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';
import type { NotificationMarkReadArgs } from '../../../../types/mittwald/notification.js';

export const handleMittwaldNotificationMarkRead: MittwaldToolHandler<NotificationMarkReadArgs> = async (args, { mittwaldClient }) => {
  try {
    const { notificationId } = args;

    if (!notificationId) {
      throw new Error("notificationId is required");
    }

    const response = await mittwaldClient.api.notification.sreadNotification({
      notificationId
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully marked notification as read",
      result: {
        notificationId,
        status: "read",
        updated: true
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to mark notification as read: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};