# Sultan Biryani and Grill — Security Specification

## 1. Data Invariants
1. A `UserProfile` at `/users/{userId}` can only be read or created/updated by the verified Google-authenticated user whose `request.auth.uid == userId`. No listing of `/users` is permitted to protect PII (`email`).
2. A `SavedAddress` at `/users/{userId}/addresses/{addressId}` cannot exist without a valid parent `/users/{userId}` document (`exists()` Master Gate), and only the owning `userId` can read, list, create, update, or delete it.
3. An `Order` at `/orders/{orderId}` can only be created by a verified authenticated user whose `request.auth.uid == incoming().userId`, with an existing `/users/{uid}` profile, initial status strictly set to `'confirmed'`, `paymentMethod == 'cod'`, and `request.time` timestamps.
4. Terminal states (`'delivered'`, `'cancelled'`) on `/orders/{orderId}` lock the document permanently against further mutations.
5. No client may spoof `userId`, `createdAt`, inject ghost fields, or query other users' orders (`allow list` checks `resource.data.userId == request.auth.uid`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on User Create**: `{ uid: "u1", displayName: "Ali", email: "a@b.com", isAdmin: true, createdAt: serverTime, updatedAt: serverTime }` -> Rejected by `hasOnly(...)`.
2. **Unverified Email Write**: Creating `/users/u1` with `request.auth.token.email_verified == false` -> Rejected by `isEmailVerified()`.
3. **PII Cross-User Get**: Authenticated user `u2` calling `get(/users/u1)` -> Rejected by `request.auth.uid == userId`.
4. **Blanket User List Scrape**: Authenticated user `u1` calling `list(/users)` -> Rejected by `allow list: if false`.
5. **Orphan Address Create**: Creating `/users/u1/addresses/addr1` when `/users/u1` does not exist -> Rejected by `exists(/databases/.../users/u1)`.
6. **ID Poisoning**: Creating `/orders/../../evil_1.5kb_string` -> Rejected by `isValidId(orderId)`.
7. **Identity Spoofing on Order Create**: User `u1` creating `/orders/o1` with `userId: "u2"` -> Rejected by `incoming().userId == request.auth.uid`.
8. **State Shortcutting on Order Create**: Creating `/orders/o1` with `status: "delivered"` -> Rejected by `incoming().status == 'confirmed'`.
9. **Timestamp Spoofing**: Creating `/orders/o1` with backdated `createdAt` -> Rejected by `incoming().createdAt == request.time`.
10. **Terminal State Tampering**: Updating `/orders/o1` from `status: "delivered"` back to `"cooking"` -> Rejected by terminal lock `!(existing().status in ['delivered', 'cancelled'])`.
11. **Value Poisoning on Order Update**: Updating `/orders/o1` with `affectedKeys().hasOnly(['status', 'updatedAt'])` while injecting `status: 12345` or a 1MB string -> Rejected by `isValidOrder(incoming())`.
12. **Unscoped Order List Query**: Calling `list(/orders)` without `.where('userId', '==', uid)` -> Rejected by `resource.data.userId == request.auth.uid`.
