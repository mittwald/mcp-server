import { MittwaldAPIV2Client } from '@mittwald/api-client';
const client = MittwaldAPIV2Client.newWithToken('dummy');

// Check conversation API location
console.log('client.conversation type:', typeof client.conversation);
console.log('Conversation methods:', Object.keys(client.conversation || {}));
