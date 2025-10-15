feat: add receipt styles and Tailwind CSS configuration

- Created a new CSS file for receipt styling with responsive design and print support.
- Added Tailwind CSS configuration to enable dark mode and extend theme colors and shadows.

test: add Playwright tests for product popup and reservation flow

- Implemented tests for product details popup functionality and "Add to Cart" feature.
- Added tests for reservation flow, including countdown and payment modal interactions.

chore: setup TypeScript configuration and validation script

- Added TypeScript configuration file for project compilation settings.
- Created a validation script for products.json to ensure data integrity against defined product interface.

chore: add helper functions for test setup and server management

- Introduced helper functions to start and stop a static server for testing purposes.
- Added reservation shims to facilitate testing of reservation-related functionalities.

Notes:
- If CI can't be triggered from this client due to local auth/permissions, you can upload the generated `appmat-changes.zip` (created by `scripts/create-zip.ps1`) to a GitHub issue or send to a maintainer to apply and open a PR.
- See `scripts/GitFix.ps1` for local Git diagnostic/repair guidance.
