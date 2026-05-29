const key1 = 'ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMy';
const key2 = 'MjUxOGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz=='; // Wait, let's look at the user prompt's exact string
// Prompt: ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMyIDI1OGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==
// Ah, the prompt has: ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMy (space) s 258abbcd-7254-4832-a043-957c47e7233==. Wait, the second part in prompt is 'MjUxOGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==' or 'MjU4YWJiY2QtNzI1NC00ODMyLWEwNDMtOTU3YzQ3ZTcyMzMz=='? Let's check:
// 'MjUxOGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==' is base64 for '251abbcd-7254-4832-a043-957c47e7233'
// Wait, 'MjU4YWJiY2QtNzI1NC00ODMyLWEwNDMtOTU3YzQ3ZTcyMzM=' is base64 for '258abbcd-7254-4832-a043-957c47e7233'
// Let's decode both Base64 strings:
console.log('Decoded part 1:', Buffer.from('ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMy', 'base64').toString());
console.log('Decoded part 2 (258...):', Buffer.from('MjU4YWJiY2QtNzI1NC00ODMyLWEwNDMtOTU3YzQ3ZTcyMzMz==', 'base64').toString());

const key_raw = 'ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMyIDI1OGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==';
console.log('Full Raw String decoded:', Buffer.from(key_raw, 'base64').toString());
