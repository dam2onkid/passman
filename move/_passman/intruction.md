# Password Manager Smart Contract PRD

## Overview

A decentralized password manager built on Sui blockchain utilizing the Seal encryption patterns to securely store and selectively share account credentials.

## Features

### Vault Management

- **Vault Creation**: Users can create a personal encrypted vault that serves as a container for storing multiple accounts.
- **Vault Access**: Only the vault owner can access the vault's contents by default.

### Account Management

- **Account Creation**: Users can create account entries containing credentials (username, password, URL, notes).
- **Data Storage**: Sensitive account data is encrypted and stored off-chain in Walrus (referenced by blob_id).
- **Account Metadata**: Non-sensitive metadata (account name, creation date) stored on-chain.
- **Account Operations**: View, update, and delete account entries.

### Sharing Capabilities

1. **Time-Limited Sharing**:

   - Share account access with another user for a specific time period.
   - Access automatically expires after the defined duration.

2. **One-Time Access**:
   - Grant single-use access to another user.
   - Access is automatically revoked after one successful retrieval.

## Technical Approach

### Core Patterns Integration

1. **Private Data Pattern**:

   - Used for the primary vault mechanism.
   - Accounts are stored as encrypted objects that only the owner can decrypt.

2. **Time Lock Encryption (TLE) Pattern**:

   - For time-limited sharing with automatic expiration.
   - The shared access has a definite end time after which keys are no longer available.

3. **Subscription Pattern**:

   - Modified to implement time-limited sharing.
   - Access is granted for a specific time period.

4. **Key Request Pattern**:
   - Utilized for one-time access sharing.
   - Creates a one-time use KeyRequest object that is consumed upon use.

### Data Architecture

1. **Vault Object**:

   ```
   Vault {
     id: UID,
     owner: address,
     encryption_nonce: vector<u8>,
     accounts: vector<ID>,  // IDs of account objects
   }
   ```

2. **Account Object**:

   ```
   Account {
     id: UID,
     vault_id: ID,
     name: String,          // Non-sensitive metadata
     category: String,      // Non-sensitive metadata
     created_at: u64,       // Timestamp
     updated_at: u64,       // Timestamp
     blob_id: vector<u8>,   // Reference to encrypted data in Walrus
   }
   ```

3. **Sharing Objects**:

   - **TimeShare**:

     ```
     TimeShare {
       id: UID,
       account_id: ID,
       recipient: address,
       created_at: u64,
       expires_at: u64,
     }
     ```

   - **OneTimeAccess**:
     ```
     OneTimeAccess {
       id: UID,
       account_id: ID,
       recipient: address,
       consumed: bool,
     }
     ```

### Access Control Mechanisms

1. **Vault Access**:

   - Uses the private_data pattern
   - Only the vault owner can decrypt the vault contents

2. **Time-Limited Sharing**:

   - Combines subscription and TLE patterns
   - Creates a time-bound access token
   - Automatically expires after the predefined duration

3. **One-Time Access**:
   - Uses the key_request pattern
   - Creates a consumable request object
   - Key access is granted only once and the request is marked as consumed

## User Flows

### Vault Creation

1. User initiates vault creation
2. System generates encryption keys
3. Vault object is created and owned by the user
4. Empty accounts vector is initialized

### Account Creation

1. User inputs account details (username, password, URL, notes)
2. Data is encrypted using vault's key
3. Encrypted data is stored in Walrus, returning a blob_id
4. Account object is created with reference to the blob_id
5. Account ID is added to the vault's accounts list

### Account Retrieval

1. User requests to view an account
2. System verifies user is the vault owner
3. Retrieves encrypted data from Walrus using blob_id
4. Decrypts data using vault's key
5. Presents decrypted account information to user

### Time-Limited Sharing

1. Vault owner initiates sharing with recipient address and expiration time
2. System creates a TimeShare object
3. Recipient can access the account data until expiration
4. After expiration time, access is automatically revoked

### One-Time Access Sharing

1. Vault owner initiates one-time sharing with recipient address
2. System creates a OneTimeAccess object
3. Recipient can access the account data exactly once
4. After first access, the OneTimeAccess object is marked as consumed

## Security Considerations

1. **No On-Chain Credentials**: Sensitive data is never stored unencrypted on-chain
2. **Temporal Security**: All shared access has built-in expiration
3. **Access Revocation**: Owner can manually revoke shared access before expiration
4. **Access Audit**: All sharing actions are recorded on-chain for transparency

## Future Enhancements

1. **Password Strength Analysis**: On-device password strength checking
2. **Emergency Access**: Dead man's switch for emergency access to trusted contacts
3. **Group Sharing**: Share accounts with groups of users
4. **Organization Vaults**: Team-based access control hierarchies

This PRD outlines a secure password manager built on Sui that leverages multiple encryption patterns to provide robust protection while enabling flexible sharing capabilities.
