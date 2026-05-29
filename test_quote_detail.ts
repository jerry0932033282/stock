import { RestClient } from '@fugle/marketdata';

const client = new RestClient({ apiKey: 'ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMyIDI1OGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==' });

async function run() {
  const res = await client.stock.intraday.quote({ symbol: '2330' });
  console.log('Full JSON of intraday quote:', JSON.stringify(res, null, 2));
}

run();
