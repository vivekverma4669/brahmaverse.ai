import { test, expect } from '@playwright/test';
async function login(page) {
  await page.goto('/');
  await page.getByLabel('Phone number', { exact: true }).fill('9876543210');
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await page.getByLabel('OTP digit 1', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/home/);
}
test('phone validation, keypad, OTP keyboard and paste, portions and persistent cart', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await expect(page.getByRole('alert')).toContainText('valid');
  for (const digit of '9876543210')
    await page
      .getByRole('button', { name: `Type ${digit}`, exact: true })
      .click();
  await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue(
    '9876543210',
  );
  await page.getByRole('button', { name: 'Delete digit' }).click();
  await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue(
    '987654321',
  );
  await page.getByRole('button', { name: 'Type 0', exact: true }).click();
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('all six');
  await page.getByLabel('OTP digit 1', { exact: true }).fill('000000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await page.getByLabel('OTP digit 2', { exact: true }).fill('');
  await page.getByLabel('OTP digit 1', { exact: true }).fill('1');
  await expect(page.getByLabel('OTP digit 2', { exact: true })).toBeFocused();
  await page.keyboard.press('Backspace');
  await expect(page.getByLabel('OTP digit 1', { exact: true })).toBeFocused();
  await expect(page.getByLabel('OTP digit 1', { exact: true })).toHaveValue('');
  await page.getByLabel('OTP digit 1', { exact: true }).evaluate((element) => {
    const data = new DataTransfer();
    data.setData('text', '123456');
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true }),
    );
  });
  await expect(page.getByLabel('OTP digit 6', { exact: true })).toHaveValue(
    '6',
  );
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(
    page.getByRole('heading', { name: 'Best Seller' }),
  ).toBeVisible();
  await expect(page.locator('.food-card')).toHaveCount(4);
  await page.locator('.food-card[href="/food/pizza"]').click();
  await expect(page.locator('.price-quantity-row')).toContainText('₹14.00');
  await page.getByLabel('Increase quantity').click();
  await page.getByRole('radio', { name: 'Medium (8 Slices)' }).check();
  await expect(page.locator('.price-quantity-row')).toContainText('₹53.00');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('status')).toContainText('Added 4');
  await page.getByRole('button', { name: 'View cart' }).click();
  await expect(page.locator('.cart-total')).toContainText('₹212.00');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Go back' }).click();
  await expect(page.getByLabel('Open cart, 4 items')).toBeVisible();
  await page.locator('.food-card[href="/food/pizza"]').click();
  await expect(
    page.getByRole('radio', { name: 'Medium (8 Slices)' }),
  ).toBeChecked();
  await expect(page.locator('.quantity')).toContainText('4');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.reload();
  await page.getByLabel('Open cart, 4 items').click();
  await page.getByLabel('Decrease quantity').click();
  await expect(page.locator('.cart-total')).toContainText('₹159.00');
  for (let index = 0; index < 3; index++)
    await page.getByLabel('Decrease quantity').click();
  await expect(page.getByText('Your bag is waiting')).toBeVisible();
  expect(errors).toEqual([]);
});
test('resend countdown and complete OTP using the on-screen keypad', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByLabel('Phone number', { exact: true }).fill('9876543210');
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  await page.clock.fastForward(31000);
  await page.getByRole('button', { name: 'Resend OTP' }).click();
  await expect(page.getByRole('status')).toContainText('no SMS was sent');
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  for (const digit of '123456')
    await page
      .getByRole('button', { name: `Type ${digit}`, exact: true })
      .click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/home/);
});
test('home reference interactions: location, offer, cancel and track', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('button', { name: /Current Locations/ }).click();
  await page
    .getByLabel('Your area or neighbourhood')
    .fill('Model Town, New Delhi');
  await page.getByRole('button', { name: 'Save location' }).click();
  await page.getByRole('button', { name: 'View offer' }).click();
  await expect(page.getByRole('status')).toContainText('30% off');
  await page.getByRole('button', { name: 'Track Driver' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Driver on the way');
  await page.getByRole('button', { name: 'Close tracking' }).click();
  await page.getByRole('button', { name: 'Cancel Order' }).first().click();
  await expect(page.getByText('Order cancelled')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Order cancelled')).toBeVisible();
});
test('four screens at mobile and desktop widths without overflow or missing images', async ({
  page,
}) => {
  await login(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/', '/verify', '/home', '/food/pizza']) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect
        .poll(() =>
          page
            .locator('img')
            .evaluateAll((images) =>
              images.every((image) => image.complete && image.naturalWidth > 0),
            ),
        )
        .toBe(true);
      if (width === 390)
        await page.screenshot({
          path: `test-results/${route === '/' ? 'phone' : route.replaceAll('/', '-')}.png`,
          fullPage: true,
        });
    }
  }
});
