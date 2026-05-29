import { RestClient } from '@fugle/marketdata';

const client = new RestClient({ apiKey: 'dummy' });

console.log('stock keys:', Object.keys(client.stock));
if (client.stock.snapshot) {
  console.log('snapshot keys:', Object.keys(client.stock.snapshot));
} else {
  console.log('no snapshot property on client.stock');
}
