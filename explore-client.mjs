import { MittwaldAPIV2Client } from '@mittwald/api-client';
const client = MittwaldAPIV2Client.newWithToken('dummy');

// Check if notification is part of typed API
console.log('client.notification type:', typeof client.notification);
console.log('client.api type:', typeof client.api);
console.log('client.typedApi type:', typeof client.typedApi);

// Check available namespaces on typedApi
if (client.typedApi) {
  console.log('\\ntypedApi namespaces:', Object.keys(client.typedApi));
}

// Check if sreadNotification exists
console.log('\\nclient.notification.sreadNotification exists:', typeof client.notification?.sreadNotification);
console.log('client.api.notification exists:', typeof client.api?.notification);
