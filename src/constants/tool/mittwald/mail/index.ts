export * from './mail-addresses.js';
export * from './delivery-boxes.js';
export * from './mail-settings.js';

// Re-export all mail tools as an array for easy registration
import {
  mail_list_mail_addresses,
  mail_create_mail_address,
  mail_get_mail_address,
  mail_delete_mail_address,
  mail_update_mail_address_address,
  mail_update_mail_address_password,
  mail_update_mail_address_quota,
  mail_update_mail_address_forward_addresses,
  mail_update_mail_address_autoresponder,
  mail_update_mail_address_spam_protection,
  mail_update_mail_address_catch_all,
} from './mail-addresses.js';

import {
  mail_list_delivery_boxes,
  mail_create_delivery_box,
  mail_get_delivery_box,
  mail_delete_delivery_box,
  mail_update_delivery_box_description,
  mail_update_delivery_box_password,
} from './delivery-boxes.js';

import {
  mail_list_project_mail_settings,
  mail_update_project_mail_setting,
} from './mail-settings.js';

export const MAIL_TOOLS = [
  // Mail Addresses
  mail_list_mail_addresses,
  mail_create_mail_address,
  mail_get_mail_address,
  mail_delete_mail_address,
  mail_update_mail_address_address,
  mail_update_mail_address_password,
  mail_update_mail_address_quota,
  mail_update_mail_address_forward_addresses,
  mail_update_mail_address_autoresponder,
  mail_update_mail_address_spam_protection,
  mail_update_mail_address_catch_all,
  // Delivery Boxes
  mail_list_delivery_boxes,
  mail_create_delivery_box,
  mail_get_delivery_box,
  mail_delete_delivery_box,
  mail_update_delivery_box_description,
  mail_update_delivery_box_password,
  // Mail Settings
  mail_list_project_mail_settings,
  mail_update_project_mail_setting,
];