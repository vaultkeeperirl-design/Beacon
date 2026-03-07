## 2024-03-08 - Secure Express Header configuration
**Vulnerability:** The application was missing basic security headers like `x-powered-by` to hide technology stack information.
**Learning:** `helmet` package is not available in the project, so simple native Express configuration like `app.disable('x-powered-by')` can be used to prevent leaking the tech stack details to potential attackers.
**Prevention:** Always remember to at least disable `x-powered-by` header natively if `helmet` is not used.

