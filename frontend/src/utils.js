export const MOCK_OTP = '123456';
export function validPhone(phone, country) {
  return (country === '+44' ? /^\d{10,11}$/ : /^\d{10}$/).test(phone);
}
export function cartSubtotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
export function cartCount(cart) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
export const money = (value) =>
  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
