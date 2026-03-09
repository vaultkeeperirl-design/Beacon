# Backend REST API Documentation

This document outlines the RESTful API endpoints provided by the Beacon backend server (Signaling Server) located in `backend/server.js`. The API primarily handles authentication, user profiles, wallet interactions, and basic network statistics. Real-time signaling and P2P communication are handled via Socket.IO, which is not covered in this document.

## Streams

### `GET /api/streams`
Retrieves a list of all currently active streams. **No authentication required.**

- **Response (200 OK):**
  ```json
  [
    {
      "id": "broadcaster_username",
      "title": "Welcome to my stream!",
      "tags": "Beacon, P2P, Streaming",
      "streamer": "broadcaster_username",
      "viewers": 5
    }
  ]
  ```

### `GET /api/streams/:streamId`
Fetches details for a specific active stream. **No authentication required.**

- **URL Parameters:**
  - `streamId`: The username of the broadcaster.
- **Response (200 OK):**
  ```json
  {
    "id": "broadcaster_username",
    "title": "Welcome to my stream!",
    "tags": "Beacon, P2P, Streaming",
    "streamer": "broadcaster_username",
    "viewers": 5
  }
  ```
- **Response (404 Not Found):** If the stream does not exist or is offline.

## Authentication

All endpoints requiring authentication must include an `Authorization` header with a valid JSON Web Token (JWT):
`Authorization: Bearer <token>`

### `POST /api/auth/register`
Creates a new user account.

- **Request Body:**
  ```json
  {
    "username": "new_user",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK):**
  Returns a JWT token and the newly created user profile.
  ```json
  {
    "token": "ey...",
    "user": { "id": 1, "username": "new_user", "credits": 0.0, "avatar_url": null, "bio": null, "follower_count": 0, "following_count": 0 }
  }
  ```
- **Response (400 Bad Request):** If username or password is missing, or if the username already exists.

### `POST /api/auth/login`
Authenticates an existing user.

- **Request Body:**
  ```json
  {
    "username": "existing_user",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK):**
  Returns a JWT token and the user profile.
  ```json
  {
    "token": "ey...",
    "user": { "id": 1, "username": "existing_user", "credits": 10.5, "avatar_url": null, "bio": null, "follower_count": 0, "following_count": 5 }
  }
  ```
- **Response (400 Bad Request):** If username or password is missing.
- **Response (401 Unauthorized):** If the password or username is incorrect.

## Users & Profiles

### `GET /api/users/:username`
Fetches the public profile of a user. **No authentication required.**

- **URL Parameters:**
  - `username`: The username of the user to look up.
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "username": "target_user",
    "avatar_url": "https://example.com/avatar.png",
    "bio": "Streamer bio...",
    "follower_count": 42,
    "following_count": 10
  }
  ```
- **Response (404 Not Found):** If the user does not exist.

### `PATCH /api/users/profile`
Updates the authenticated user's profile information. **Authentication Required.**

- **Request Body:**
  ```json
  {
    "bio": "New bio",
    "avatar_url": "https://example.com/new_avatar.png"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": { "id": 1, "username": "current_user", "bio": "New bio", "avatar_url": "https://example.com/new_avatar.png", "follower_count": 0, "following_count": 5 },
    "message": "Profile updated successfully"
  }
  ```

### `DELETE /api/users/:username`
Deletes the specified user account permanently. **Authentication Required.**

- **URL Parameters:**
  - `username`: The username of the account to delete.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Account permanently deleted"
  }
  ```
- **Response (403 Forbidden):** If attempting to delete an account other than your own.
- **Response (404 Not Found):** If the user does not exist.

### `POST /api/users/:username/follow`
Follows a specific user. **Authentication Required.**

- **URL Parameters:**
  - `username`: The username of the user to follow.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Successfully followed target_user"
  }
  ```
- **Response (400 Bad Request):** If attempting to follow yourself.
- **Response (404 Not Found):** If the user to follow does not exist.
- **Response (409 Conflict):** If you are already following the user.

### `DELETE /api/users/:username/follow`
Unfollows a specific user. **Authentication Required.**

- **URL Parameters:**
  - `username`: The username of the user to unfollow.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Successfully unfollowed target_user"
  }
  ```
- **Response (400 Bad Request):** If you are not currently following the user.
- **Response (404 Not Found):** If the user to unfollow does not exist.

### `GET /api/users/:username/following`
Retrieves a list of users that the specified user is following. **No authentication required.**

- **URL Parameters:**
  - `username`: The username of the follower.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 2,
      "username": "followed_user",
      "avatar_url": "https://example.com/avatar.png",
      "bio": "I stream cool stuff",
      "follower_count": 100
    }
  ]
  ```

### `GET /api/users/:username/followers`
Retrieves a list of users that follow the specified user. **No authentication required.**

- **URL Parameters:**
  - `username`: The username of the followed user.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 3,
      "username": "follower_user",
      "avatar_url": "https://example.com/follower_avatar.png",
      "bio": "Huge fan!",
      "follower_count": 5
    }
  ]
  ```

## Economy (Wallet & Tipping)

### `GET /api/wallet`
Retrieves the authenticated user's current credit balance. **Authentication Required.**

- **Response (200 OK):**
  ```json
  {
    "balance": 150.75
  }
  ```

### `POST /api/tip`
Sends a tip (credits) from the authenticated user to a stream's squad. **Authentication Required.**

- **Request Body:**
  ```json
  {
    "streamId": "broadcaster_username",
    "amount": 10.5
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Tip sent successfully"
  }
  ```
- **Response (400 Bad Request):** If `streamId` or `amount` are invalid, or if the user has insufficient funds.

### `POST /api/ads/trigger`
Simulates triggering an ad break, which distributes credits to active viewers/relays. **Authentication Required.** (Currently restricted in code logic).

- **Request Body:**
  ```json
  {
    "streamId": "broadcaster_username"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Ad triggered and credits distributed"
  }
  ```
- **Response (403 Forbidden):** If the user is not the host of the stream.

## Network Health

### `GET /api/node-stats`
Returns current statistics for the signaling server and connected mesh. **No authentication required.**

- **Response (200 OK):**
  ```json
  {
    "status": "Online",
    "meshNodes": 120
  }
  ```
