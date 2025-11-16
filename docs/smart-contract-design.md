# Passman Smart Contract Design

## Tổng quan

Passman sử dụng 3 module Move trên Sui blockchain để xây dựng hệ thống quản lý mật khẩu phi tập trung:

- **vault**: Quản lý vault và item (mật khẩu/credential)
- **share**: Chia sẻ item với người dùng khác
- **utils**: Các hàm tiện ích

## Kiến trúc tổng thể

### Ownership Model (Capability-Based)

Passman sử dụng **Capability Pattern** để quản lý quyền sở hữu:

- Mỗi Vault có một `Cap` object tương ứng
- Mỗi Share có một `Cap` object tương ứng
- Chỉ người sở hữu `Cap` mới có quyền thực hiện các thao tác (tạo/sửa/xóa)

### Object Model

```
User
 ├─ Cap (vault ownership)
 ├─ Vault (owned object)
 │   └─ items: vector<ID>
 └─ Share Cap (share ownership)

Shared Objects:
 ├─ Item (shared object - accessible by anyone with vault access)
 └─ Share (shared object - defines sharing permissions)
```

## Module: `passman::vault`

### Data Structures

#### `Item`

Đại diện cho một mục mật khẩu/credential được mã hóa.

```move
public struct Item has key {
    id: UID,
    name: String,           // Tên item
    category: String,       // Loại (password, wallet, note, etc.)
    vault_id: ID,          // ID của vault chứa item
    nonce: vector<u8>,     // Nonce cho mã hóa
    data: vector<u8>,      // Dữ liệu đã mã hóa
}
```

**Đặc điểm:**

- `has key`: Item là shared object, có thể truy cập từ nhiều transaction
- `nonce`: Dùng cho encryption scheme (kết hợp với vault_id tạo namespace)
- `data`: Dữ liệu đã được mã hóa ở client-side trước khi lưu on-chain

#### `Vault`

Container chứa các item của người dùng.

```move
public struct Vault has key {
    id: UID,
    name: String,
    items: vector<ID>      // Danh sách ID của các item
}
```

**Đặc điểm:**

- Owned object (thuộc sở hữu của user)
- Lưu trữ danh sách ID của các item để tracking

#### `Cap`

Capability object chứng minh quyền sở hữu vault.

```move
public struct Cap has key {
    id: UID,
    vault_id: ID
}
```

**Đặc điểm:**

- Owned object (thuộc sở hữu của user)
- Được dùng để xác thực quyền truy cập trong mọi thao tác

### Events

```move
public struct VaultCreated has copy, drop {
    vault_id: ID,
    owner: address
}

public struct ItemCreated has copy, drop {
    item_id: ID,
    vault_id: ID,
    name: String,
    category: String,
}

public struct ItemUpdated has copy, drop {
    item_id: ID,
    vault_id: ID,
}

public struct ItemDeleted has copy, drop {
    item_id: ID,
    vault_id: ID,
    name: String,
}
```

### Core Functions

#### 1. Vault Creation

```move
entry fun create_vault_entry(name: String, ctx: &mut TxContext)
```

**Flow:**

1. Tạo `Vault` object với tên và danh sách items rỗng
2. Tạo `Cap` object tương ứng với `vault_id`
3. Emit `VaultCreated` event
4. Transfer `Cap` và `Vault` cho người gọi

**Kết quả:** User nhận được 2 owned objects (Vault + Cap)

#### 2. Item Creation

```move
entry fun create_item_entry(
    cap: &Cap,
    name: String,
    category: String,
    vault: &mut Vault,
    nonce: vector<u8>,
    data: vector<u8>,
    ctx: &mut TxContext
)
```

**Flow:**

1. Verify ownership: `cap.vault_id == object::id(vault)`
2. Tạo `Item` object với dữ liệu đã mã hóa
3. Thêm `item_id` vào `vault.items`
4. Emit `ItemCreated` event
5. Share object `Item` (để có thể truy cập từ nhiều nơi)

**Bảo mật:**

- Chỉ người có `Cap` mới tạo được item
- Item được share nhưng vẫn được bảo vệ bởi seal mechanism

#### 3. Item Update

```move
entry fun update_item(
    cap: &Cap,
    name: String,
    data: vector<u8>,
    item: &mut Item
)
```

**Flow:**

1. Verify ownership: `cap.vault_id == item.vault_id`
2. Cập nhật `name` và `data`
3. Emit `ItemUpdated` event

**Lưu ý:** Không cập nhật `nonce` (nonce cố định khi tạo)

#### 4. Item Deletion

```move
entry fun delete_item(
    cap: &Cap,
    vault: &mut Vault,
    item: Item
)
```

**Flow:**

1. Verify ownership: `cap.vault_id == item.vault_id`
2. Emit `ItemDeleted` event
3. Xóa `item_id` khỏi `vault.items`
4. Delete `Item` object

#### 5. Seal Approve (Access Control)

```move
entry fun seal_approve(
    id: vector<u8>,
    vault: &Vault,
    item: &Item
)
```

**Purpose:** Xác thực quyền truy cập item thông qua seal mechanism.

**Policy Check:**

```move
fun check_policy(id: vector<u8>, vault: &Vault, item: &Item): bool {
    if(object::id(vault) != item.vault_id) return false;
    let mut namespace = object::id(vault).to_bytes();
    namespace.append(item.nonce);
    is_prefix(namespace, id)
}
```

**Namespace Structure:** `[vault_id][nonce]`

**Cách hoạt động:**

1. Kiểm tra item thuộc vault
2. Tạo namespace từ `vault_id + nonce`
3. Kiểm tra `id` có prefix là namespace không
4. Nếu đúng → approve access

**Use case:** Frontend sẽ tạo seal với `id = [pkg-id][vault-id][nonce]` để decrypt dữ liệu

## Module: `passman::share`

### Data Structures

#### `Share`

Đại diện cho một lần chia sẻ item với người khác.

```move
public struct Share has key {
    id: UID,
    vault_id: ID,              // ID của vault chứa item
    item_id: ID,               // ID của item được share
    recipients: vector<address>, // Danh sách người nhận
    created_at: u64,           // Timestamp tạo (ms)
    ttl: u64                   // Time-to-live (ms)
}
```

**Đặc điểm:**

- Shared object (có thể truy cập bởi recipients)
- Time-bound: Có thời hạn sử dụng (created_at + ttl)
- Multi-recipient: Có thể share cho nhiều người

#### `Cap`

Capability chứng minh quyền sở hữu share.

```move
public struct Cap has key {
    id: UID,
    share_id: ID
}
```

### Events

```move
public struct ShareCreated has copy, drop {
    item_id: ID,
    recipients: vector<address>,
    created_at: u64,
    ttl: u64
}
```

### Core Functions

#### 1. Share Creation

```move
public entry fun share_item_entry(
    vault: &Vault,
    item: &Item,
    recipients: vector<address>,
    created_at: u64,
    ttl: u64,
    ctx: &mut TxContext
)
```

**Flow:**

1. Tạo `Share` object với thông tin recipients và TTL
2. Tạo `Cap` object tương ứng
3. Emit `ShareCreated` event
4. Share object `Share`
5. Transfer `Cap` cho người tạo

**Lưu ý:** Không verify ownership ở đây (có thể share item của người khác nếu có quyền truy cập)

#### 2. Share Update

```move
public fun update_share_item(
    cap: &Cap,
    share: &mut Share,
    recipients: vector<address>,
    ttl: u64
)
```

**Flow:**

1. Verify ownership: `cap.share_id == object::id(share)`
2. Cập nhật `recipients` và `ttl`

**Use case:** Thay đổi danh sách người nhận hoặc gia hạn thời gian

#### 3. Share Deletion

```move
public fun delete_share_item(cap: Cap, share: Share)
```

**Flow:**

1. Verify ownership
2. Delete `Share` và `Cap` objects

#### 4. Seal Approve (Share Access Control)

```move
entry fun seal_approve(
    id: vector<u8>,
    share: &Share,
    c: &Clock,
    ctx: &TxContext
)
```

**Policy Check:**

```move
fun check_policy(
    id: vector<u8>,
    share: &Share,
    caller: address,
    c: &Clock
): bool {
    if(!share.recipients.contains(&caller)) return false;
    if(c.timestamp_ms() > share.created_at + share.ttl) return false;

    let namespace = share.vault_id.to_bytes();
    is_prefix(namespace, id)
}
```

**Kiểm tra:**

1. Caller có trong danh sách `recipients`
2. Share chưa hết hạn (current_time ≤ created_at + ttl)
3. `id` có prefix là `vault_id`

**Namespace Structure:** `[vault_id]` (không cần nonce vì share không cần decrypt)

## Module: `passman::utils`

### `is_prefix`

```move
public(package) fun is_prefix(prefix: vector<u8>, word: vector<u8>): bool
```

**Purpose:** Kiểm tra một vector có phải là prefix của vector khác không.

**Implementation:**

- So sánh từng byte từ đầu
- Return false nếu prefix dài hơn word
- Return true nếu tất cả bytes của prefix khớp với đầu word

**Use case:** Dùng trong seal mechanism để verify namespace

## Seal Mechanism (Encryption & Access Control)

### Concept

Passman sử dụng **Seal** (từ Sui framework) để mã hóa dữ liệu:

- Dữ liệu được encrypt ở client với seal key
- Seal key được derive từ transaction context
- Chỉ có transaction thỏa mãn policy mới decrypt được

### Namespace Design

#### Vault Access

```
Namespace = [vault_id][nonce]
Seal ID = [pkg-id][vault-id][nonce]
```

- Owner tạo seal với full ID
- Policy check: ID phải có prefix là namespace
- Đảm bảo chỉ owner của vault + item cụ thể mới decrypt được

#### Share Access

```
Namespace = [vault_id]
Seal ID = [pkg-id][vault-id]
```

- Recipient tạo seal với vault_id
- Policy check: ID phải có prefix là vault_id + caller trong recipients + chưa hết hạn
- Recipient có thể truy cập nhưng không thể modify

### Security Properties

1. **Confidentiality**: Dữ liệu được mã hóa, chỉ người có quyền mới decrypt
2. **Integrity**: Smart contract verify ownership trước khi cho phép thay đổi
3. **Time-bound Access**: Share có TTL, tự động expire
4. **Selective Sharing**: Chỉ recipients cụ thể mới truy cập được
5. **Non-repudiation**: Mọi thao tác được ghi nhận qua events

## Design Patterns

### 1. Capability Pattern

- Tách ownership thành object riêng (`Cap`)
- Linh hoạt trong việc transfer quyền sở hữu
- Clear separation of concerns

### 2. Shared Object Pattern

- `Item` và `Share` là shared objects
- Cho phép nhiều transaction truy cập đồng thời
- Phù hợp với use case sharing

### 3. Event-Driven Architecture

- Emit events cho mọi state change
- Frontend lắng nghe events để update UI
- Audit trail cho security

### 4. Namespace-Based Access Control

- Sử dụng prefix matching thay vì complex ACL
- Gas-efficient
- Tích hợp tốt với seal mechanism

## Trade-offs & Considerations

### Shared vs Owned Objects

**Item là Shared Object:**

- ✅ Dễ dàng share với nhiều người
- ✅ Không cần transfer ownership
- ❌ Phức tạp hơn trong access control
- ❌ Có thể có contention issues

**Alternative:** Item có thể là owned object, share bằng cách transfer temporarily → phức tạp hơn trong implementation

### Nonce Design

**Nonce cố định:**

- ✅ Đơn giản, không cần quản lý nonce history
- ❌ Không thể rotate encryption key
- ❌ Nếu nonce bị lộ, phải tạo item mới

**Alternative:** Cho phép update nonce → cần cơ chế re-encryption

### TTL Implementation

**TTL là duration (không phải absolute timestamp):**

- ✅ Linh hoạt, có thể extend
- ✅ Không phụ thuộc vào clock khi tạo
- ❌ Cần Clock object khi verify

### Gas Optimization

- Sử dụng `vector<ID>` thay vì nested objects
- Prefix matching thay vì full comparison
- Events chỉ chứa thông tin cần thiết

## Future Improvements

1. **Batch Operations**: Tạo/xóa nhiều items cùng lúc
2. **Vault Sharing**: Share cả vault thay vì từng item
3. **Access Revocation**: Thu hồi quyền truy cập trước khi hết TTL
4. **Encryption Key Rotation**: Cho phép update nonce và re-encrypt
5. **Multi-sig Vault**: Vault cần nhiều signatures để thao tác
6. **Audit Log**: Ghi nhận chi tiết hơn về access history
