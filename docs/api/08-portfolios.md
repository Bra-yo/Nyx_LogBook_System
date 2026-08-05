# Portfolios

## Overview

Portfolio endpoints expose student portfolio profile data and allow profile updates for authenticated users.

## GET /api/portfolio

Response:
- `200 OK`
- `{ success: true, user: { id, name, email, phone, avatar, role, bio, skills, certificates, socialLinks, company, department, roleTitle, profile }, summary: { ... }, achievements: [...], timeline: [...], projects: [...], competencyHighlights: [...], charts: { ... } }`

Authorization:
- Authenticated users only

Errors:
- `401 Unauthorized`
- `404 Not Found` if the user is missing
- `500 Internal Server Error`

## PUT /api/portfolio

Request body:
- `bio` string optional
- `skills` string[] optional
- `certificates` array optional
- `socialLinks` record<string, string> optional

Behavior:
- Normalizes skills, certificate entries, and social link values.
- Updates the current user record.

Response:
- `200 OK`
- `{ success: true, user: { ... } }`

Errors:
- `400 Bad Request` for validation failures
- `401 Unauthorized`
- `500 Internal Server Error`
