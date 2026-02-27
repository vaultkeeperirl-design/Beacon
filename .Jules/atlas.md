## 2024-05-24 - Streamline Poll Data
**Learning:** The `voters` Set in the `poll` object was being sent to the client, even though it wasn't being used. This wasted bandwidth and exposed internal implementation details.
**Action:** We destructured the `poll` object to exclude `voters` before sending it to the client. This is a good practice to follow for all objects sent over the wire.
