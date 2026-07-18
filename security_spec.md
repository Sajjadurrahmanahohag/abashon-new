# Security Specification for Abashon Firestore Security Rules

This specification establishes Attribute-Based Access Control (ABAC) invariants and outlines malicious payloads designed to test security boundaries.

## 1. Core Data Invariants

1. **User Identity Isolation**: A user profile document (`/users/{userId}`) can only be written by its owner (`request.auth.uid == userId`). Users are barred from modifying their `role` or privilege fields once created to prevent self-assigned privilege escalation.
2. **Property Integrity**: Property listings (`/properties/{propertyId}`) can only be added or modified by verified landlords or the corporate `company` admin account.
3. **Chat Thread Privacy**: A chat thread document (`/chats/{chatId}`) can only be accessed (read/written) by the tenant or landlord listed as parties in that thread.
4. **Subcollection Atomicity**: Nested messages in `/chats/{chatId}/messages/{messageId}` can only be appended if the caller is an active participant in the parent chat document.
5. **Verified Verification**: Core write actions must enforce that the user's email is verified (`request.auth.token.email_verified == true`).

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent unauthorized modification attempts that MUST be rejected with `PERMISSION_DENIED`.

### Payload 1: Self-Role Escalation
- **Target**: `/users/usr_tenant_123`
- **Attempt**: Update own profile to set `role: "company"` admin.
- **Malicious Payload**:
```json
{
  "role": "company"
}
```

### Payload 2: Host Identity Spoofing
- **Target**: `/properties/prop_new`
- **Attempt**: Create a listing where host ID in payload does not match authenticated user ID.
- **Malicious Payload**:
```json
{
  "id": "prop_new",
  "title": "Hacker Luxury Villa",
  "host": { "uid": "usr_victim_99", "name": "Sarah Connor" }
}
```

### Payload 3: Private Data Snooping
- **Target**: `/users/usr_private_abc`
- **Attempt**: Retrieve private details of another user's profile as an unrelated authenticated tenant.
- **Action**: `get()`

### Payload 4: Arbitrary Chat Initiation (Impersonation)
- **Target**: `/chats/chat_fake_01`
- **Attempt**: Creating a chat where `tenantId` does not match the active auth user ID.
- **Malicious Payload**:
```json
{
  "id": "chat_fake_01",
  "propertyId": "prop_01",
  "tenantId": "usr_victim_abc",
  "landlordId": "usr_landlord_99"
}
```

### Payload 5: Message Spoofing
- **Target**: `/chats/chat_valid_01/messages/msg_hacked`
- **Attempt**: Sending a message into a chat thread of which the sender is NOT a participant.
- **Action**: `create` message inside third-party thread.

### Payload 6: Overflow Key Attack (Shadow Field Injection)
- **Target**: `/users/usr_tenant_123`
- **Attempt**: Attempt to inject unapproved/shadow fields into a document.
- **Malicious Payload**:
```json
{
  "uid": "usr_tenant_123",
  "name": "Sajjad Godrej",
  "role": "customer",
  "isVerifiedAdminOverride": true,
  "createdAt": "2026-07-15T18:22:15Z"
}
```

### Payload 7: Denial of Wallet (ID Poisoning)
- **Target**: `/properties/<extremely_long_junk_string_over_200_chars_or_special_chars>`
- **Attempt**: Writing listing documents with massive poisoned IDs to exhaust system storage.

### Payload 8: Mutative Key Escalation on List Fields
- **Target**: `/properties/prop_01`
- **Attempt**: Modifying restricted fields such as rating/reviewsCount by standard owners.
- **Malicious Payload**:
```json
{
  "rating": 5.0,
  "reviewsCount": 100000
}
```

### Payload 9: Invalid Value Poisoning (Type Violation)
- **Target**: `/properties/prop_01`
- **Attempt**: Sending boolean/string mismatch payloads (e.g. integer value inside title).

### Payload 10: Unverified Email Write Bypasses
- **Target**: `/properties/prop_01`
- **Attempt**: Writing data when `request.auth.token.email_verified == false`.

### Payload 11: Timestamp Injection
- **Target**: `/properties/prop_01`
- **Attempt**: Injecting a forged future or past timestamp instead of `request.time` (Server Timestamp).

### Payload 12: Terminal State Lock Break
- **Target**: `/properties/prop_01`
- **Attempt**: Modifying an immutable property or a terminated status key.

---

## 3. Test Verification Plan

Tests are simulated using security rules assertions to verify that each of the above patterns correctly fails authentication gates while legitimate queries succeed.
