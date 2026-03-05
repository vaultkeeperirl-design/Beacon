## 2024-05-24 - Streamline Poll Data
**Learning:** The `voters` Set in the `poll` object was being sent to the client, even though it wasn't being used. This wasted bandwidth and exposed internal implementation details.
**Action:** We destructured the `poll` object to exclude `voters` before sending it to the client. This is a good practice to follow for all objects sent over the wire.

## 2024-10-25 - Implement Mutable User Profiles
**Learning:** User profiles (`bio`, `avatar_url`) were immutable after registration. A default bio ("I love streaming on Beacon!") was hardcoded, preventing users from customizing their channels, even though the frontend UI expected this capability.
**Action:** Added a `PATCH /api/users/profile` endpoint to allow authenticated users to update their bio and avatar_url, bringing the backend into alignment with user expectations and frontend capabilities.

## 2026-03-03 - Add Validation to Registration API
**Learning:** Malformed data can cause frontend breakage. When users are generated with extreme attributes like single character names or whitespace names, it breaks layout. SQLite allows it. We need explicit API-level bounds checking even for basic authentication flows, especially mapping into socket namespaces.
**Action:** Implemented strict alphanumeric requirements, 3-30 character length restrictions, and simple password boundaries directly inside the REST endpoint `/api/auth/register` in `backend/server.js`.

## 2025-02-13 - Implement Persistent Follows API
**Learning:** The frontend allowed users to "follow" streams, but it was purely relying on `localStorage`. If users cleared their cache or logged in on another device, they lost their followed list. This breaks the expected user experience.
**Action:** Added a robust `Follows` mapping table to the backend `Users` database and implemented `POST`, `DELETE`, and `GET` endpoints for `/api/users/:username/follow`. This ensures follow states are durable, device-agnostic, and safe.

## 2025-10-25 - Implement Followers API Endpoint
**Learning:** The backend already supported returning the list of users a specific user was following, but lacked the symmetric endpoint to return who was following them, which is a common community feature.
**Action:** Implemented `GET /api/users/:username/followers` in `backend/server.js` and verified its correctness with automated integration tests.
