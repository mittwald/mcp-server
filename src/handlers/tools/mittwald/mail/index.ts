// Export all mail addresses handlers
export {
  handleListMailAddresses,
  handleCreateMailAddress,
  handleGetMailAddress,
  handleDeleteMailAddress,
  handleUpdateMailAddressAddress,
  handleUpdateMailAddressPassword,
  handleUpdateMailAddressQuota,
  handleUpdateMailAddressForwardAddresses,
  handleUpdateMailAddressAutoresponder,
  handleUpdateMailAddressSpamProtection,
  handleUpdateMailAddressCatchAll,
  type ListMailAddressesArgs,
  type CreateMailAddressArgs,
  type GetMailAddressArgs,
  type DeleteMailAddressArgs,
  type UpdateMailAddressAddressArgs,
  type UpdateMailAddressPasswordArgs,
  type UpdateMailAddressQuotaArgs,
  type UpdateMailAddressForwardAddressesArgs,
  type UpdateMailAddressAutoresponderArgs,
  type UpdateMailAddressSpamProtectionArgs,
  type UpdateMailAddressCatchAllArgs,
} from './mail-addresses.js';

// Export all delivery boxes handlers
export {
  handleListDeliveryBoxes,
  handleCreateDeliveryBox,
  handleGetDeliveryBox,
  handleDeleteDeliveryBox,
  handleUpdateDeliveryBoxDescription,
  handleUpdateDeliveryBoxPassword,
  type ListDeliveryBoxesArgs,
  type CreateDeliveryBoxArgs,
  type GetDeliveryBoxArgs,
  type DeleteDeliveryBoxArgs,
  type UpdateDeliveryBoxDescriptionArgs,
  type UpdateDeliveryBoxPasswordArgs,
} from './delivery-boxes.js';

// Export all mail settings handlers
export {
  handleListProjectMailSettings,
  handleUpdateProjectMailSetting,
  type ListProjectMailSettingsArgs,
  type UpdateProjectMailSettingArgs,
} from './mail-settings.js';