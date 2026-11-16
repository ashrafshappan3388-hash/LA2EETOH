# LA2EETOH Security Specification (Payload-First Security TDD)

## 1. Core Data Invariants
1. **PII Isolation**: Private user PII (`email`, `phone`, `role`, notification preferences) lives strictly under `/users/{userId}` and is NEVER readable by other users. Public profiles under `/usersPublic/{userId}` contain zero PII.
2. **Location Privacy Isolation**: Exact coordinates and private verification questions live under `/reports/{reportId}/private/{detailId}` and are strictly readable only by the report owner and verified admins. Public `/reports/{reportId}` stores only `publicLat` / `publicLng`.
3. **Zero Self-Assigned Privilege Escalation**: Users creating `/users/{userId}` can only set `role == 'user'` and cannot write to `/admins/{userId}` or modify `role` on update.
4. **Immutable Ownership & Timestamps**: `ownerId` and `createdAt` are immutable after creation; `createdAt` and `updatedAt` must equal `request.time`.
5. **Support Internal Note Isolation**: `/supportTickets/{ticketId}/internalNotes/{noteId}` is strictly restricted to admins; ticket owners can never read or write staff internal notes.
6. **Verified Identity**: Standard writes require `request.auth != null && request.auth.token.email_verified == true`.
7. **Self-Review & Fake Rating Prevention**: In `/userReviews/{reviewId}`, `reviewerUid == request.auth.uid`, `targetUid != request.auth.uid`, `rating` is an integer `1..5`, and `exists(/databases/$(database)/documents/recoveryCases/$(incoming().caseId))` must hold.

## 2. Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Admin Escalation on Signup**: `POST /users/uid123` with `{ role: "admin", ... }` -> DENIED (`incoming().role == 'user'`).
2. **Ghost Field Injection on Report Create**: `POST /reports/r1` with extra key `{ isAdminVerified: true }` -> DENIED (`hasOnly` check).
3. **Unverified Email Spoof**: Write attempt with `email: "Ashraf.shappan3388@gmail.com"` and `email_verified: false` -> DENIED (`email_verified == true`).
4. **Cross-User PII Read**: Authenticated user `uidA` calling `GET /users/uidB` -> DENIED.
5. **Unbounded String / Denial of Wallet**: `POST /reports/r1` with `title` length `5000` chars or ID length `300` chars -> DENIED (`isValidId` + `.size()` limits).
6. **Owner Spoofing on Report Create**: `uidA` creating `/reports/r2` with `ownerId: "uidB"` -> DENIED (`incoming().ownerId == request.auth.uid`).
7. **Terminal State Bypass**: Updating a `closed` or `recovered` report as non-admin -> DENIED.
8. **Private Coordinate Leak**: Non-owner reading `/reports/r1/private/details` -> DENIED.
9. **Support Internal Note Leak**: Ticket owner reading `/supportTickets/t1/internalNotes/n1` -> DENIED.
10. **Self-Review Manipulation**: Creating `/userReviews/rev1` with `reviewerUid == targetUid` -> DENIED.
11. **Direct Reputation Forgery**: User updating `reputationScore` directly on `/usersPublic/{userId}` -> DENIED (`affectedKeys().hasOnly(['displayName', 'photoUrl', 'updatedAt'])`).
12. **Client Timestamp Forgery**: Creating a report with backdated `createdAt` != `request.time` -> DENIED.
