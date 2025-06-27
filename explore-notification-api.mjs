import { MittwaldAPIV2Client } from '@mittwald/api-client';
const client = MittwaldAPIV2Client.newWithToken('dummy');

// Check sreadNotification signature
const method = client.notification.sreadNotification;
console.log('sreadNotification:', method.toString().substring(0, 200));
