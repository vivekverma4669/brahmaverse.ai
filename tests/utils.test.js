import test from 'node:test';
import assert from 'node:assert/strict';
import { validPhone, cartCount, cartSubtotal, MOCK_OTP } from '../src/utils.js';
test('phone validation rejects incomplete numbers and letters', () => {
  assert.equal(validPhone('9876543210', '+91'), true);
  for (const number of ['', '123', '12345678901', 'abcdefghij'])
    assert.equal(validPhone(number, '+91'), false);
  assert.equal(validPhone('79123456789', '+44'), true);
});
test('cart count and subtotal account for quantities', () => {
  const cart = [
    { price: 149, quantity: 2 },
    { price: 249, quantity: 1 },
  ];
  assert.equal(cartCount(cart), 3);
  assert.equal(cartSubtotal(cart), 547);
  assert.equal(cartCount([]), 0);
  assert.equal(cartSubtotal([]), 0);
});
test('mock OTP is explicitly six digits', () =>
  assert.match(MOCK_OTP, /^\d{6}$/));
