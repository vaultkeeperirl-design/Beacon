## 2025-02-17 - [Squad Split Infinite Money Vulnerability]
**Vulnerability:** The `/api/tip` endpoint calculates stream squad payouts by multiplying the `amount` tipped by the `split` percentage. The `update-squad` handler only validated that the total sum of `split` percentages equalled 100%, allowing users to input negative percentages (e.g., -100% and 200%).
**Learning:** Checking aggregate sums is insufficient for bounds testing; variables that represent a ratio/percentage must individually be verified not to drop below zero or exceed the total (100).
**Prevention:** Always implement explicit upper and lower bounds checks on individual user inputs, especially when calculating financial/credit distributions.
## 2025-02-17 - [Hardcoded JWT Fallback Secret]
**Vulnerability:** The backend authentication system used a hardcoded fallback string ('super_secret_beacon_key_123') for the 'JWT_SECRET' if the environment variable was missing.
**Learning:** Hardcoding fallback secrets allows attackers who can discover or guess the repository source code to trivially forge authentication tokens if a production environment forgets to configure the secret environment variable.
**Prevention:** Always default to a securely generated random string (e.g., 'crypto.randomBytes(64).toString("hex")') for sensitive cryptographic fallback keys.
