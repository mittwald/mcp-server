import { mailSettingsSuccessMessages } from '../../../../constants/tool/mittwald/mail/mail-settings.js';
import { MailError } from '../../../../types/mittwald/mail.js';
import { formatMittwaldToolResponse } from '../types.js';
import type { MittwaldToolHandler } from '../types.js';
import type { UpdateMailSettingBlacklistRequest, UpdateMailSettingWhitelistRequest } from '../../../../types/mittwald/mail.js';

// List project mail settings
export interface ListProjectMailSettingsArgs {
  projectId: string;
}

export const handleListProjectMailSettings: MittwaldToolHandler<ListProjectMailSettingsArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { projectId } = args;

    const response = await mittwaldClient.api.mail.listProjectMailSettings({
      projectId,
    });

    if (response.status !== 200) {
      throw new MailError('Failed to list project mail settings', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailSettingsSuccessMessages.list,
      result: response.data,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to list project mail settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update project mail setting
export interface UpdateProjectMailSettingArgs {
  projectId: string;
  mailSetting: 'blacklist' | 'whitelist';
  value: string[];
}

export const handleUpdateProjectMailSetting: MittwaldToolHandler<UpdateProjectMailSettingArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { projectId, mailSetting, value } = args;

    let requestData: UpdateMailSettingBlacklistRequest | UpdateMailSettingWhitelistRequest;
    
    if (mailSetting === 'blacklist') {
      requestData = { blacklist: value };
    } else {
      requestData = { whitelist: value };
    }

    const response = await mittwaldClient.api.mail.updateProjectMailSetting({
      projectId,
      mailSetting,
      data: requestData as any,
    });

    if (response.status !== 204) {
      throw new MailError('Failed to update project mail setting', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailSettingsSuccessMessages.update,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update project mail setting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};