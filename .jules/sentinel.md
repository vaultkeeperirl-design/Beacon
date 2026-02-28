## 2025-02-17 - [Squad Split Infinite Money Vulnerability]
**Vulnerability:** The `/api/tip` endpoint calculates stream squad payouts by multiplying the `amount` tipped by the `split` percentage. The `update-squad` handler only validated that the total sum of `split` percentages equalled 100%, allowing users to input negative percentages (e.g., -100% and 200%).
**Learning:** Checking aggregate sums is insufficient for bounds testing; variables that represent a ratio/percentage must individually be verified not to drop below zero or exceed the total (100).
**Prevention:** Always implement explicit upper and lower bounds checks on individual user inputs, especially when calculating financial/credit distributions.
