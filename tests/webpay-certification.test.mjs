import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCertificationInput, validateRefundTarget } from '../scripts/webpay-certification.mjs';

const target = { token: 'a'.repeat(64), buyOrder: 'DM-' + 'b'.repeat(23), amount: 65980 };
test('accepts exact sandbox order and bounded partial or total refund', () => {
  validateCertificationInput({ ...target, refundAmount: 1000 });
  validateCertificationInput({ ...target, refundAmount: 65980 });
});
test('rejects malformed tokens, order ids and unbounded refund amounts', () => {
  for (const change of [{ token: '../secret' }, { buyOrder: 'arbitrary' }, { amount: NaN }, { refundAmount: 0 }, { refundAmount: -1 }, { refundAmount: 65981 }, { refundAmount: 1.5 }]) {
    assert.throws(() => validateCertificationInput({ ...target, ...change }));
  }
});
test('requires provider approval and exact order and amount before any refund', () => {
  const result = { buy_order: target.buyOrder, amount: 65980, status: 'AUTHORIZED', response_code: 0 };
  validateRefundTarget(result, target);
  for (const change of [{ buy_order: 'different' }, { amount: 65979 }, { status: 'REVERSED' }, { status: 'PARTIALLY_NULLIFIED' }, { status: 'INITIALIZED' }, { response_code: -1 }]) {
    assert.throws(() => validateRefundTarget({ ...result, ...change }, target));
  }
});
