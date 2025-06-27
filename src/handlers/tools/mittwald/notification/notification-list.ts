import type { 
  MittwaldToolHandler
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';
import type { NotificationListArgs } from '../../../../types/mittwald/notification.js';

export const handleMittwaldNotificationList: MittwaldToolHandler<NotificationListArgs> = async (args, { mittwaldClient }) => {
  try {
    const { status, limit, skip, page } = args;

    const queryParams: any = {};
    if (status) queryParams.status = status;
    if (limit) queryParams.limit = limit;
    if (skip) queryParams.skip = skip;
    if (page) queryParams.page = page;

    const response = await mittwaldClient.api.notification.slistNotifications({
      queryParameters: queryParams
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully retrieved notifications",
      result: {
        notifications: response.data,
        count: response.data?.length || 0
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to list notifications: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};