import { deliveryBoxesSuccessMessages } from '../../../../constants/tool/mittwald/mail/delivery-boxes.js';
import { MailError } from '../../../../types/mittwald/mail.js';
import { formatMittwaldToolResponse } from '../types.js';
import type { MittwaldToolHandler } from '../types.js';
import type {
  CreateDeliveryBoxRequest,
  UpdateDeliveryBoxDescriptionRequest,
  UpdateDeliveryBoxPasswordRequest,
} from '../../../../types/mittwald/mail.js';

// List delivery boxes
export interface ListDeliveryBoxesArgs {
  projectId: string;
  limit?: number;
  skip?: number;
}

export const handleListDeliveryBoxes: MittwaldToolHandler<ListDeliveryBoxesArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { projectId, limit = 50, skip = 0 } = args;

    const response = await mittwaldClient.api.mail.listDeliveryBoxes({
      projectId,
      queryParameters: { limit, skip },
    });

    if (response.status !== 200) {
      throw new MailError('Failed to list delivery boxes', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: deliveryBoxesSuccessMessages.list,
      result: response.data,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to list delivery boxes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Create delivery box
export interface CreateDeliveryBoxArgs extends CreateDeliveryBoxRequest {
  projectId: string;
}

export const handleCreateDeliveryBox: MittwaldToolHandler<CreateDeliveryBoxArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { projectId, ...requestBody } = args;

    const response = await mittwaldClient.api.mail.createDeliverybox({
      projectId,
      data: requestBody,
    });

    if (response.status !== 201) {
      throw new MailError('Failed to create delivery box', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: deliveryBoxesSuccessMessages.create,
      result: response.data,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to create delivery box: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Get delivery box
export interface GetDeliveryBoxArgs {
  deliveryBoxId: string;
}

export const handleGetDeliveryBox: MittwaldToolHandler<GetDeliveryBoxArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { deliveryBoxId } = args;

    const response = await mittwaldClient.api.mail.getDeliveryBox({
      deliveryBoxId,
    });

    if (response.status !== 200) {
      throw new MailError('Failed to get delivery box', 'DELIVERY_BOX_NOT_FOUND', response);
    }

    return formatMittwaldToolResponse({
      message: deliveryBoxesSuccessMessages.get,
      result: response.data,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to get delivery box: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Delete delivery box
export interface DeleteDeliveryBoxArgs {
  deliveryBoxId: string;
}

export const handleDeleteDeliveryBox: MittwaldToolHandler<DeleteDeliveryBoxArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { deliveryBoxId } = args;

    const response = await mittwaldClient.api.mail.deleteDeliveryBox({
      deliveryBoxId,
    });

    if (response.status !== 204) {
      throw new MailError('Failed to delete delivery box', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: deliveryBoxesSuccessMessages.delete,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to delete delivery box: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update delivery box description
export interface UpdateDeliveryBoxDescriptionArgs extends UpdateDeliveryBoxDescriptionRequest {
  deliveryBoxId: string;
}

export const handleUpdateDeliveryBoxDescription: MittwaldToolHandler<UpdateDeliveryBoxDescriptionArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { deliveryBoxId, description } = args;

    const response = await mittwaldClient.api.mail.updateDeliveryBoxDescription({
      deliveryBoxId,
      data: { description },
    });

    if (response.status !== 204) {
      throw new MailError('Failed to update delivery box description', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: deliveryBoxesSuccessMessages.updateDescription,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update delivery box description: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update delivery box password
export interface UpdateDeliveryBoxPasswordArgs extends UpdateDeliveryBoxPasswordRequest {
  deliveryBoxId: string;
}

export const handleUpdateDeliveryBoxPassword: MittwaldToolHandler<UpdateDeliveryBoxPasswordArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { deliveryBoxId, password } = args;

    const response = await mittwaldClient.api.mail.updateDeliveryBoxPassword({
      deliveryBoxId,
      data: { password },
    });

    if (response.status !== 204) {
      throw new MailError('Failed to update delivery box password', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: deliveryBoxesSuccessMessages.updatePassword,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update delivery box password: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};