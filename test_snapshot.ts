import { RestClient } from '@fugle/marketdata';

const keyWithSpace = 'ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMyIDI1OGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==';
const keyPart1 = 'ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMy';

async function testSnapshot(label: string, key: string) {
  try {
    const client = new RestClient({ apiKey: key });
    const res = await client.stock.snapshot.quotes({ market: 'TSE' });
    console.log(`[${label}] Snapshot SUCCESS! Keys:`, Object.keys(res));
    if (res.data) {
      console.log(`[${label}] Data length:`, res.data.length);
      console.log(`[${label}] Sample:`, JSON.stringify(res.data[0]));
    } else {
      console.log(`[${label}] Res:`, JSON.stringify(res));
    }
  } catch (err: any) {
    console.log(`[${label}] Snapshot FAILED:`, err.message || err);
  }
}

async function run() {
  await testSnapshot('Key with Space', keyWithSpace);
  await testSnapshot('Key Part 1', keyPart1);
}

run();
