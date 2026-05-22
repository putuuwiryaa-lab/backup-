# Analisa Angka

Aplikasi dashboard analisa angka berbasis React, Vite, Supabase, dan Vercel Serverless API.

## Fitur utama

- Login trial otomatis 14 hari tanpa PIN.
- Aktivasi VIP menggunakan PIN berbasis Device Key 6 digit.
- Role akses: `TRIAL`, `PRO`/`VIP`, dan `MASTER`.
- Device identity v2: `deviceId` rahasia di browser dan `displayCode`/Device Key 6 digit untuk admin/support.
- Dashboard daftar pasaran.
- Halaman analisis per pasaran.
- Admin panel untuk mengelola data pasaran dan history result.
- Logout tanpa menghapus Device Key.
- Vercel Analytics.

## Tech stack

- React 19
- Vite 6
- TypeScript
- Supabase
- Vercel Serverless Functions
- JWT
- Tailwind CSS

## Environment variables

### Frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Backend / Vercel API

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
TOKEN_VERSION=2
PIN_SECRET=
MASTER_PIN=
```

Catatan:

- `JWT_SECRET` digunakan untuk menandatangani token login.
- `TOKEN_VERSION` digunakan untuk memutus sesi lama bila sistem auth diubah.
- `PIN_SECRET` harus sama dengan secret pada alat generator PIN VIP.
- `MASTER_PIN` adalah PIN khusus admin/master.
- Jangan expose `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `PIN_SECRET`, atau `MASTER_PIN` ke frontend.

## Database Supabase

Tabel minimum yang dipakai aplikasi:

### `markets`

Menyimpan daftar pasaran dan history result.

Field yang dipakai:

```sql
id text primary key,
name text,
history_data text,
"order" int,
updated_at timestamptz
```

### `trial_activations_v2`

Menyimpan aktivasi trial sistem login baru.

```sql
create table if not exists trial_activations_v2 (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  display_code text not null,
  activated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists trial_activations_v2_display_code_idx
on trial_activations_v2 (display_code);

create index if not exists trial_activations_v2_expires_at_idx
on trial_activations_v2 (expires_at);
```

## Sistem login

### Trial

User baru klik tombol:

```text
Mulai Trial Gratis 14 Hari
```

Frontend mengirim `deviceId` dan `displayCode` ke:

```text
POST /api/trial
```

Backend membuat token dengan role `TRIAL` dan masa aktif 14 hari.

### VIP / PRO

User klik:

```text
Saya Punya PIN VIP
```

Lalu memasukkan PIN VIP dari admin. PIN VIP dibuat dari Device Key 6 digit memakai role prefix `PRO`.

Endpoint:

```text
POST /api/auth
```

Token VIP aktif 60 hari.

### MASTER

MASTER login melalui form PIN yang sama. Bila PIN cocok dengan `MASTER_PIN`, role menjadi `MASTER`.

Token MASTER aktif 365 hari.

## Device identity v2

Browser menyimpan dua nilai:

```text
supreme_device_id      UUID rahasia, tidak ditampilkan ke user
supreme_display_code   Device Key 6 digit untuk user/admin
```

Saat logout, aplikasi hanya menghapus:

```text
supreme_token
```

Device Key tidak dihapus, supaya user tetap punya kode aktivasi/support yang sama.

## Generator PIN VIP

Generator PIN VIP harus memakai `PIN_SECRET` yang sama dengan Vercel.

Contoh generator Python:

```python
import hmac
import hashlib
import re

PIN_SECRET = "ISI_SAMA_DENGAN_PIN_SECRET_DI_VERCEL"

def generate_secure_pin(device_key, role_prefix):
    message = str(device_key).strip() + role_prefix
    signature = hmac.new(
        PIN_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    numeric_only = re.sub(r"\D", "", signature)
    return numeric_only[:6].zfill(6)

while True:
    device_key = input("Masukkan Device Key pembeli: ").strip()
    if device_key.lower() == "exit":
        break
    if not re.fullmatch(r"\d{6}", device_key):
        print("Device Key harus 6 digit")
        continue
    print("PIN VIP:", generate_secure_pin(device_key, "PRO"))
```

Trial tidak memakai PIN lagi.

## Admin panel

Admin panel tersedia di:

```text
/admin
```

Syarat:

- User harus login sebagai `MASTER`.
- Token harus valid terhadap `deviceId` browser.

Fungsi admin:

- Tambah pasaran.
- Hapus pasaran.
- Reorder pasaran.
- Simpan history result.

## Menjalankan lokal

Install dependency:

```bash
npm install
```

Buat file `.env.local` berisi env frontend dan backend yang dibutuhkan.

Jalankan development server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Type check:

```bash
npm run lint
```

Catatan: script `lint` menjalankan TypeScript check (`tsc --noEmit`).

## Deploy

Aplikasi dideploy di Vercel.

Set semua environment variables di Vercel Project Settings. Setelah push ke branch `main`, Vercel akan redeploy otomatis.

## Operasional admin

Alur aktivasi VIP:

1. User klik trial atau login page.
2. User melihat Device Key 6 digit.
3. User mengirim Device Key ke admin.
4. Admin generate PIN VIP dari Device Key tersebut.
5. User klik `Saya Punya PIN VIP` dan memasukkan PIN.

Alur logout:

1. User klik tombol `Logout` di dashboard.
2. Token dihapus.
3. Device Key tetap disimpan.
4. User bisa login ulang dengan trial aktif/VIP PIN sesuai status token baru.

## Catatan keamanan

- Jangan commit secret ke repository.
- Jangan tampilkan `deviceId` rahasia ke user.
- Jangan simpan PIN mentah di database/log.
- Rate limiter saat ini masih sederhana. Untuk produksi besar, pindahkan rate limit ke database atau Redis.
- Jika ingin memaksa logout massal, naikkan `TOKEN_VERSION` dan deploy ulang perubahan token signer/verifier bila diperlukan.
