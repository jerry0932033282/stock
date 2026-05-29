import { RestClient } from '@fugle/marketdata';

const keyWithSpace = 'ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMyIDI1OGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==';
const keyNoSpace = 'ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMyMjUxOGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==';
const keyPart1 = 'ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMy';
const keyPart2 = 'MjU4YWJiY2QtNzI1NC00ODMyLWEwNDMtOTU3YzQ3ZTcyMzM='; // wait, without space, let's check:
const keyPart2_decoded = '258abbcd-7254-4832-a043-957c47e72333';
const keyPart2_encoded = Buffer.from(keyPart2_decoded).toString('base64');

async function test(label: string, key: string) {
  try {
    const client = new RestClient({ apiKey: key });
    // let's try intraday.quote for 2330, which is smaller and less likely to hit snapshot limits
    const res = await client.stock.intraday.quote({ symbol: '2330' });
    console.log(`[${label}] SUCCESS! Keys:`, Object.keys(res));
    if (res && (res as any).symbol) {
      console.log(`[${label}] Data:`, JSON.stringify(res).substring(0, 100));
    } else {
      console.log(`[${label}] Res:`, JSON.stringify(res));
    }
  } catch (err: any) {
    console.log(`[${label}] FAILED:`, err.message || err);
  }
}

async function run() {
  await test('Key with Space', keyWithSpace);
  await test('Key No Space', keyNoSpace);
  await test('Key Part 1', keyPart1);
  await test('Key Part 2 Encoded', keyPart2_encoded);
}

run();
