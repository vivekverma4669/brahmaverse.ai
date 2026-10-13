# Fastor — React assignment

Four screens recreated from the provided `figmapic.png`: phone sign-up, six-digit OTP, food home, and pizza details. React, JavaScript, Vite, React Router, Lucide, regular CSS, and local mock data.

## Run

Requires Node.js 20.19+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. `npm run build` generates production assets; `npm run preview` previews the build. Production hosting needs an SPA fallback to `index.html`.

## Mock behavior

- Enter any valid 10-digit India/US phone number (10–11 digits for UK).
- OTP: **123456**. No SMS is sent. Resend is available after 30 seconds.
- Both physical and on-screen numeric keyboards work. OTP supports paste, arrows and backspace. `inputMode="none"` prevents a second native keyboard overlapping the reference keypad.
- Select any bestseller or popular item to view details. The offer opens the pizza.
- Pizza starts at quantity 3 and ₹14.00, as in the screenshot. Selecting a portion changes its unit price; cart subtotal is unit price × quantity. Selections and cart persist in sessionStorage (`fastor-v2`).
- Cancel Order and Track Driver act on local demo orders only; no real orders, location service, driver tracking, SMS or payment is connected.
- The blue bag button opens the cart; cart quantities can be edited or reduced to zero to remove an item. The orange offer button reveals the demo promotion.

## Verify

```sh
npm test
npm run test:e2e
```

Playwright uses installed Microsoft Edge. Tests cover authentication, both keypads, resend, portions, cart persistence, home interactions, local images, and overflow at 320/390/768/1440px. Screenshots are generated in `test-results/`.

## Reference and limitations

The original Figma link remains inaccessible; the implementation now follows the supplied screenshot rather than the earlier sage/cream interpretation. White backgrounds, orange actions, sparse auth pages, numeric keypads, location/account strip, four bestsellers, the 30% banner, two popular-item rows and pizza portions follow the reference. Unsupported search, categories, green branding and bottom navigation were removed.

The exact food photos are displayed as regions of the local screenshot (`public/assets/figma-reference.png`) via `ReferenceImage`; no remote food images are needed. Their sharpness is limited by the 728×349 source. Exact original font, vector icons, full-resolution assets and prototype transitions cannot be recovered from this screenshot. Inter approximates the font with system fallbacks. A subtle mock-OTP note, cart dialog and accessible back control on the food image support the working demo; these are implementation additions. The status bar and home indicator are decorative.
