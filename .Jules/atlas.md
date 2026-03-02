## 2024-05-24 - Streamline Poll Data
**Learning:** The `voters` Set in the `poll` object was being sent to the client, even though it wasn't being used. This wasted bandwidth and exposed internal implementation details.
**Action:** We destructured the `poll` object to exclude `voters` before sending it to the client. This is a good practice to follow for all objects sent over the wire.

## 2024-10-25 - Implement Mutable User Profiles
**Learning:** User profiles (`bio`, `avatar_url`) were immutable after registration. A default bio ("I love streaming on Beacon!") was hardcoded, preventing users from customizing their channels, even though the frontend UI expected this capability.
**Action:** Added a `PATCH /api/users/profile` endpoint to allow authenticated users to update their bio and avatar_url, bringing the backend into alignment with user expectations and frontend capabilities.
