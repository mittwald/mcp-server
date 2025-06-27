import { MittwaldAPIV2Client } from '@mittwald/api-client';
const client = MittwaldAPIV2Client.newWithToken('dummy');
console.log('Notification methods:', Object.keys(client.notification || {}));
console.log('typedApi.notification methods:', Object.keys(client.typedApi?.notification || {}));
