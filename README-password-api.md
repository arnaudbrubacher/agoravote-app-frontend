# Password Change API Implementation Guide

This document provides instructions for implementing the password change API endpoints for both users and groups in the AgoraVote backend.

## User Password Change Endpoint

### Endpoint: `PUT /users/:userId/password`

#### Request

- **Headers**:
  - `Authorization`: Bearer token for authentication

- **URL Parameters**:
  - `userId`: The ID of the user whose password is being changed

- **Request Body**:
  ```json
  {
    "current_password": "current-password",
    "new_password": "new-password"
  }
  ```

#### Response

- **200 OK**: Password changed successfully
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

- **400 Bad Request**: Invalid input
  ```json
  {
    "error": "New password must be at least 6 characters long"
  }
  ```

- **401 Unauthorized**: Current password is incorrect
  ```json
  {
    "error": "Current password is incorrect"
  }
  ```

- **403 Forbidden**: Not authorized to change this user's password
  ```json
  {
    "error": "You are not authorized to change this user's password"
  }
  ```

- **404 Not Found**: User not found
  ```json
  {
    "error": "User not found"
  }
  ```

- **500 Internal Server Error**: Server error
  ```json
  {
    "error": "Internal server error"
  }
  ```

#### Implementation Notes

1. Verify that the user making the request is authenticated and authorized to change the password
2. Validate the current password against the stored password hash
3. Validate the new password (e.g., minimum length, complexity)
4. Hash the new password
5. Update the user's password in the database
6. Return a success response

## Group Password Change Endpoint

### Endpoint: `PUT /groups/:groupId/password`

#### Request

- **Headers**:
  - `Authorization`: Bearer token for authentication

- **URL Parameters**:
  - `groupId`: The ID of the group whose password is being changed

- **Request Body**:
  ```json
  {
    "current_password": "current-password",
    "new_password": "new-password"
  }
  ```

#### Response

- **200 OK**: Password changed successfully
  ```json
  {
    "message": "Group password changed successfully"
  }
  ```

- **400 Bad Request**: Invalid input
  ```json
  {
    "error": "New password must be at least 6 characters long"
  }
  ```

- **401 Unauthorized**: Current password is incorrect
  ```json
  {
    "error": "Current password is incorrect"
  }
  ```

- **403 Forbidden**: Not authorized to change this group's password
  ```json
  {
    "error": "You are not authorized to change this group's password"
  }
  ```

- **404 Not Found**: Group not found
  ```json
  {
    "error": "Group not found"
  }
  ```

- **500 Internal Server Error**: Server error
  ```json
  {
    "error": "Internal server error"
  }
  ```

#### Implementation Notes

1. Verify that the user making the request is authenticated and is an admin of the group
2. Validate the current password against the stored group password hash
3. Validate the new password (e.g., minimum length, complexity)
4. Hash the new password
5. Update the group's password in the database
6. Return a success response

## Security Considerations

1. Always hash passwords before storing them in the database
2. Use a strong hashing algorithm like bcrypt, Argon2, or PBKDF2
3. Implement rate limiting to prevent brute force attacks
4. Log password change attempts for security auditing
5. Consider implementing password history to prevent reuse of recent passwords
6. Validate password strength (length, complexity, etc.)
7. Use HTTPS for all API requests to ensure data is encrypted in transit 