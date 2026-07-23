/**
 * Mail address and delivery box operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

// Mail addresses
export interface ListMailAddressesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listMailAddresses(options: ListMailAddressesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.mail.listMailAddresses({ projectId: options.projectId }));
}

export interface GetMailAddressOptions extends LibraryFunctionBase {
  mailAddressId: string;
}

export async function getMailAddress(options: GetMailAddressOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.mail.getMailAddress({ mailAddressId: options.mailAddressId }));
}

export interface CreateMailAddressOptions extends LibraryFunctionBase {
  projectId: string;
  address: string;
  forwardAddresses?: string[];
}

export async function createMailAddress(options: CreateMailAddressOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.mail.createMailAddress({
        projectId: options.projectId,
        data: { address: options.address, forwardAddresses: options.forwardAddresses },
      }),
    201
  );
}

export interface UpdateMailAddressCatchAllOptions extends LibraryFunctionBase {
  mailAddressId: string;
  active: boolean;
}

export async function updateMailAddressCatchAll(options: UpdateMailAddressCatchAllOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.mail.updateMailAddressCatchAll({
        mailAddressId: options.mailAddressId,
        data: { active: options.active },
      }),
    204
  );
}

export interface DeleteMailAddressOptions extends LibraryFunctionBase {
  mailAddressId: string;
}

export async function deleteMailAddress(options: DeleteMailAddressOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.mail.deleteMailAddress({ mailAddressId: options.mailAddressId }), 204);
}

// Delivery boxes
export interface ListDeliveryBoxesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listDeliveryBoxes(options: ListDeliveryBoxesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.mail.listDeliveryBoxes({ projectId: options.projectId }));
}

export interface GetDeliveryBoxOptions extends LibraryFunctionBase {
  deliveryBoxId: string;
}

export async function getDeliveryBox(options: GetDeliveryBoxOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.mail.getDeliveryBox({ deliveryBoxId: options.deliveryBoxId }));
}

export interface CreateDeliveryBoxOptions extends LibraryFunctionBase {
  projectId: string;
  description: string;
  password: string;
}

export async function createDeliveryBox(options: CreateDeliveryBoxOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.mail.createDeliverybox({
        projectId: options.projectId,
        data: { description: options.description, password: options.password },
      }),
    201
  );
}

export interface UpdateDeliveryBoxOptions extends LibraryFunctionBase {
  deliveryBoxId: string;
  description?: string;
  password?: string;
}

export async function updateDeliveryBox(options: UpdateDeliveryBoxOptions): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.mail.updateDeliveryBoxDescription({
        deliveryBoxId: options.deliveryBoxId,
        data: { description: options.description! },
      }),
    204
  );
}

export interface DeleteDeliveryBoxOptions extends LibraryFunctionBase {
  deliveryBoxId: string;
}

export async function deleteDeliveryBox(options: DeleteDeliveryBoxOptions): Promise<LibraryResult<void>> {
  return executeApiCall(options.apiToken, (client) => client.mail.deleteDeliveryBox({ deliveryBoxId: options.deliveryBoxId }), 204);
}
