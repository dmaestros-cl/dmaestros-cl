// Manual certification utility. Deliberately cannot connect to production.
// Cards and simulated bank authentication remain exclusively in Webpay's UI.
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const endpoint = 'https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions';
const headers = {
  'Content-Type': 'application/json',
  'Tbk-Api-Key-Id': '597055555532',
  // Public integration credential published by Transbank; NOT a production secret.
  'Tbk-Api-Key-Secret': '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
};

export function validateCertificationInput({ token, buyOrder, amount, refundAmount }) {
  if (!/^[a-zA-Z0-9]{64}$/.test(token ?? '')) throw new Error('Invalid sandbox token');
  if (!/^DM-[a-f0-9]{23}$/.test(buyOrder ?? '')) throw new Error('Expected an exact DMaestros test order');
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('Invalid expected amount');
  if (refundAmount !== undefined && (!Number.isSafeInteger(refundAmount) || refundAmount < 1 || refundAmount > amount)) {
    throw new Error('Invalid refund amount');
  }
}

export function validateRefundTarget(result, { buyOrder, amount }) {
  if (result.buy_order !== buyOrder || result.amount !== amount) throw new Error('Provider transaction does not match the expected order and amount');
  if (result.status !== 'AUTHORIZED' || result.response_code !== 0) throw new Error('Only an authorized, not previously refunded, sandbox transaction may be refunded');
}

async function request(token, refundAmount) {
  const refund = refundAmount !== undefined;
  const response = await fetch(`${endpoint}/${token}${refund ? '/refunds' : ''}`, {
    method: refund ? 'POST' : 'GET', headers, redirect: 'error',
    body: refund ? JSON.stringify({ amount: refundAmount }) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Transbank integration HTTP ${response.status}; do not blindly retry a refund`);
  return response.json();
}

async function main() {
  const [operation, token, buyOrder, rawAmount, rawRefund, outputPath] = process.argv.slice(2);
  if (!['status', 'refund-test-only'].includes(operation)) throw new Error('Use status or refund-test-only');
  const input = { token, buyOrder, amount: Number(rawAmount), refundAmount: operation === 'refund-test-only' ? Number(rawRefund) : undefined };
  validateCertificationInput(input);
  const before = await request(token);
  if (before.buy_order !== buyOrder || before.amount !== input.amount) throw new Error('Transaction mismatch');
  let refund;
  let after = before;
  if (operation === 'refund-test-only') {
    if (!outputPath) throw new Error('An evidence output file is required before refunding');
    validateRefundTarget(before, input);
    // No automatic retries. A lost response must be investigated with status.
    refund = await request(token, input.refundAmount);
    await writeFile(outputPath, JSON.stringify({ environment: 'integration', checkedAt: new Date().toISOString(), buyOrder, token, before, requestedRefund: input.refundAmount, refund }, null, 2));
    if (refund.type !== 'REVERSED' && !(refund.type === 'NULLIFIED' && refund.response_code === 0 && refund.nullified_amount === input.refundAmount && refund.balance === input.amount - input.refundAmount)) {
      throw new Error('Refund was not confirmed; inspect the saved response before any further action');
    }
    after = await request(token);
  }
  const evidence = { environment: 'integration', checkedAt: new Date().toISOString(), buyOrder, token, before, requestedRefund: input.refundAmount, refund, after };
  if (outputPath) await writeFile(outputPath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
