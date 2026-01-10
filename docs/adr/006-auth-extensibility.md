# ADR 006: Authentication Extensibility

## Status
Accepted

## Context
The system currently uses Local DB auth but has a future requirement to support OIDC providers (Google, Okta, GitHub).

## Decision
We will use a **User Entity** pattern with an abstract **AuthenticationProvider** interface.

## Rationale
1.  **Abstraction:** The `AuthService` (Issuer of JWTs) should not care if the user came from a DB password check or an OpenID Connect callback. It only needs a valid `User` entity.
2.  **Schema Support:** The `users` table includes `provider` ('local', 'google', etc.) and `provider_id` columns to store external identities alongside local ones.

## Implementation Details
*   **Interface:** `AuthenticationProvider::validate(...) : ?User`
*   **Entity:** `User` model contains properties for `provider` and `providerId`.
*   **Providers:** `DatabaseAuthProvider` (Local), and future `OidcAuthProvider`.
