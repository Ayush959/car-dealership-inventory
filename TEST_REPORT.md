# Test report

Verified locally on 23 October 2026 with Python 3.12.14, Node.js 22.20.0, and Chromium through Playwright.

| Check | Result | Evidence |
| --- | --- | --- |
| Backend API suite | **56 passed** | [pytest output](docs/backend-tests.txt), [JUnit XML](docs/backend-junit.xml) |
| Backend statement coverage | **100% — 199/199 statements** | [Coverage table](docs/backend-tests.txt) |
| React component suite | **4 passed** | [Vitest output](docs/frontend-tests.txt) |
| Full browser workflow | **1 passed** | [Playwright output](docs/browser-tests.txt) |
| Production frontend build | **Passed** | [Build output](docs/build.txt) |

Coverage includes the API, database, schemas, and security modules. Test code and the explicit demo seed script are excluded. This is statement coverage, not a claim of exhaustive branch or security coverage.

## What was exercised

- Registration, password hashing, duplicate email normalization, invalid credentials, current-user lookup, expired/forged/malformed tokens, and deleted users.
- Authentication on every vehicle route, admin-only deletion/restocking, and rejection of self-assigned roles.
- Create/read/update/delete, persistent records after rebuilding the app, price precision, invalid fields, and missing records.
- Make/model/category/text/price filters, invalid price ranges, and SQL-injection-like input.
- Purchase decrement, sold-out rejection, and four simultaneous purchases against one unit of stock.
- Positive integer restock quantities, persistent development signing keys, restrictive file permissions, and configured-key validation.
- Browser sign-in, search, price filtering, create/edit/delete/restock, purchase, disabled sold-out action, registration, buyer UI restrictions, session reload, absence of browser exceptions, and a mobile horizontal-overflow check.

## Genuine red/green history

1. Backend contract tests committed first; [initial failure](docs/tdd-red.txt) records the absent implementation.
2. Backend implemented; 52 tests passed.
3. Vehicle-card tests committed before the component; [initial failure](docs/frontend-red.txt) records the absent component.
4. React implementation passed four tests and built successfully.
5. Integration startup exposed use of an unsupported `Path.open` parameter. A [failing regression](docs/startup-red.txt) was committed before the fix. The expanded suite passes all 56 tests.
6. Source formatting and a real browser workflow completed the verification.

The first browser attempt could not launch because this WSL host lacked Chromium libraries. They were downloaded into a temporary directory. A later run was interrupted by Vite hot reload while formatting source; the final run, after formatting completed, passed. Neither infrastructure failure is represented as a passing run.

One upstream Starlette/AnyIO deprecation warning remains in pytest; it does not affect results. CI is configured to repeat backend tests, component tests, the production build, and browser verification. Local results above do not imply that the remote CI run has already completed.

See README for exact reproduction commands and screenshots.
