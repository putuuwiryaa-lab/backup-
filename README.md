# Analisa Angka

Dashboard analisa angka berbasis React, Vite, TypeScript, Supabase, dan Vercel Serverless API.

Dokumen ini dibuat sebagai referensi lengkap untuk developer, maintainer, atau AI reviewer lain yang perlu memahami project tanpa harus membaca seluruh source code dari awal.

---

## 1. Ringkasan produk

Analisa Angka adalah aplikasi dashboard premium untuk mengelola data pasaran dan menjalankan beberapa mode analisa angka berdasarkan history result 4D.

Aplikasi memiliki tiga lapisan utama:

1. Frontend React untuk login, dashboard, halaman analisa, custom rekap, dan admin panel.
2. Vercel Serverless API untuk auth, trial, verify token, admin action, markets, dan engine analisa.
3. Supabase sebagai database utama untuk market data, trial activation, PIN auth attempt log, snapshot evaluasi, dan statistik.

Aplikasi memakai sistem akses berbasis token JWT dengan role:

- `TRIAL`: akses trial 14 hari.
- `PRO`: akses VIP/PRO 60 hari melalui PIN berbasis Device Key.
- `MASTER`: akses admin/master 365 hari melalui `MASTER_PIN`.

---

## 2. Tech stack

Frontend:

- React 19
- Vite 6
- TypeScript
- React Router
- Tailwind CSS
- Lucide React icons
- Motion / CSS motion utilities
- Vercel Analytics

Backend / API:

- Vercel Serverless Functions di folder `api/`
- TypeScript
- JWT (`jsonwebtoken`)
- Supabase JS client
- Node crypto HMAC

Database:

- Supabase Postgres
- Supabase anon key untuk read client-side tertentu
- Supabase service role key untuk server-side privileged actions

---

## 3. Struktur folder penting

```text
api/
  admin.ts                 Admin API: add/save/delete/reorder market
  analyze.ts               API analisa utama, validasi token, panggil predictionEngine
  auth.ts                  Login PRO/MASTER dengan PIN + DB rate limiter
  markets.ts               Endpoint list market
  trial.ts                 Aktivasi trial 14 hari
  verify.ts                Verifikasi token dan status trial
  predictionEngine.ts      Orkestrasi engine analisa
  engines/                 Rumus/engine low-level

src/
  App.tsx                  Root app, auth gate, dashboard, route setup
  components/
    LoginGate.tsx          Login trial dan PIN VIP/MASTER
    EvaluationHistory.tsx  Riwayat evaluasi dari Supabase
    analysis/              Komponen halaman analisa
  hooks/
    useStepBackNavigation  Back navigation bertahap di halaman analisa
  lib/
    analysis/              Konstanta, util, custom digit builder
  pages/
    AdminPage.tsx          Panel admin
    AnalyzeMenu.tsx        Menu mode analisa per market
    AnalysisPageV3.tsx     Wrapper ke core page
    AnalysisPageV3Core.tsx Core flow halaman analisa
    RekapWatchPage.tsx     Pantauan rekap
  ui/
    design-tokens.css      Token warna, surface, radius, motion, UI primitive
```

---

## 4. Fitur utama

### 4.1 Auth dan role

- Trial otomatis 14 hari tanpa PIN.
- Login VIP/PRO menggunakan PIN yang dibuat dari Device Key 6 digit.
- MASTER login memakai `MASTER_PIN`.
- Token JWT menyimpan `role`, `deviceId`, `displayCode`, dan `tokenVersion`.
- Logout hanya menghapus token, bukan Device Key.

### 4.2 Device identity v2

Browser menyimpan dua nilai:

```text
supreme_device_id      UUID rahasia, tidak ditampilkan ke user
supreme_display_code   Device Key 6 digit untuk user/admin/support
```

`supreme_device_id` dipakai sebagai identitas perangkat rahasia.
`supreme_display_code` dipakai sebagai kode yang dikirim user ke admin untuk aktivasi VIP.

Saat logout, aplikasi hanya menghapus:

```text
supreme_token
```

Device Key tetap disimpan agar user tidak kehilangan kode aktivasi/support.

### 4.3 Dashboard market

- Menampilkan daftar pasaran dari tabel `markets`.
- Menampilkan last result dari `history_data`.
- Setiap market dapat dibuka ke halaman analisa.

### 4.4 Halaman analisa

Route utama:

```text
/analyze/:marketId/*
```

Sub-mode:

```text
/analyze/:marketId/ai
/analyze/:marketId/bbfs
/analyze/:marketId/mati
/analyze/:marketId/jumlah
/analyze/:marketId/shio
/analyze/:marketId/rekap
```

Mode yang tersedia:

- `ai`: Angka Ikut.
- `bbfs`: BBFS.
- `mati`: Angka Mati per posisi AS/KOP/KEPALA/EKOR.
- `jumlah`: Jumlah Mati 2D.
- `shio`: Shio Mati.
- `rekap`: Custom Rekap / Racik Angka.

### 4.5 Admin panel

Route:

```text
/admin
```

Fungsi admin:

- Tambah pasaran.
- Hapus pasaran.
- Reorder pasaran.
- Simpan history result.
- Normalisasi input history agar hanya menerima token 4 digit.

Akses admin hanya untuk role `MASTER`.

---

## 5. Alur auth lengkap

### 5.1 Trial

User baru klik:

```text
Mulai Trial Gratis 14 Hari
```

Frontend mengirim request ke:

```text
POST /api/trial
```

Payload utama:

```json
{
  "deviceId": "uuid-per-browser",
  "displayCode": "123456",
  "fingerprint": {}
}
```

Backend `api/trial.ts` melakukan:

1. Validasi `deviceId` minimal 20 karakter.
2. Validasi `displayCode` 6 digit.
3. Validasi fingerprint tidak kosong.
4. Hash IP, user-agent, dan fingerprint memakai HMAC.
5. Cek apakah device/fingerprint/network-browser pernah trial.
6. Cek batas trial per IP 24 jam dan lifetime.
7. Insert row ke `trial_activations_v2`.
8. Generate JWT role `TRIAL` dengan expiry 14 hari.

Trial tidak memakai PIN.

### 5.2 PRO / VIP

User klik:

```text
Saya Punya PIN VIP
```

User memasukkan PIN dari admin.

Endpoint:

```text
POST /api/auth
```

PIN PRO dibuat dari:

```text
displayCode + "PRO"
```

dengan HMAC SHA-256 memakai `PIN_SECRET`, lalu diambil angka numerik 6 digit.

Token PRO aktif 60 hari.

### 5.3 MASTER

MASTER login melalui form PIN yang sama.

Jika PIN cocok dengan `MASTER_PIN`, role menjadi:

```text
MASTER
```

Token MASTER aktif 365 hari.

### 5.4 Verify token

Endpoint:

```text
POST /api/verify
```

`api/verify.ts` melakukan:

1. Validasi token ada.
2. Validasi `deviceId` ada.
3. Verifikasi JWT dengan `JWT_SECRET`.
4. Cek `tokenVersion` sama dengan `TOKEN_VERSION` saat ini.
5. Cek role hanya boleh `TRIAL`, `PRO`, atau `MASTER`.
6. Cek `deviceId` token cocok dengan device browser.
7. Untuk role `TRIAL`, cek row `trial_activations_v2` masih ada dan belum expired.

---

## 6. PIN auth rate limiter

Rate limiter PIN auth sudah dipindahkan dari in-memory state ke Supabase.

Endpoint terkait:

```text
api/auth.ts
```

Tabel terkait:

```text
pin_auth_attempts
```

Perilaku saat ini:

- Menghitung failed attempts berdasarkan `ip_hash`.
- Menghitung failed attempts berdasarkan `device_id`.
- Window default: 15 menit.
- Limit default: 5 failed attempts.
- Jika limit tercapai, response HTTP 429.
- Semua attempt penting dicatat ke database.

Reason yang dicatat:

```text
invalid_payload
wrong_pin
rate_limited
PRO
MASTER
```

Catatan keamanan:

- IP disimpan sebagai HMAC hash, bukan IP mentah.
- PIN mentah tidak disimpan.
- Display code bukan secret penuh, tetapi tetap tidak perlu diekspos di log publik.
- Karena attempt disimpan di database, deploy/restart/serverless instance change tidak mereset limit.

Issue GitHub terkait sudah ditutup:

```text
#2 Move PIN auth rate limit from memory to Supabase
```

---

## 7. Environment variables

### 7.1 Frontend

Dipakai oleh browser bundle. Jangan masukkan secret ke env frontend.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 7.2 Backend / Vercel API

Dipakai oleh serverless functions.

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
TOKEN_VERSION=2
PIN_SECRET=
MASTER_PIN=
INTERNAL_API_SECRET=
```

Keterangan:

- `SUPABASE_URL`: URL project Supabase.
- `SUPABASE_ANON_KEY`: anon key Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key untuk server-side privileged access. Jangan expose ke frontend.
- `JWT_SECRET`: secret untuk sign dan verify JWT.
- `TOKEN_VERSION`: versi token. Naikkan untuk memaksa semua user login ulang.
- `PIN_SECRET`: secret HMAC untuk generate PIN VIP/PRO.
- `MASTER_PIN`: PIN khusus role MASTER.
- `INTERNAL_API_SECRET`: secret optional untuk internal request ke `api/analyze.ts`.

Secret yang tidak boleh pernah masuk frontend atau commit:

```text
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
PIN_SECRET
MASTER_PIN
INTERNAL_API_SECRET
```

---

## 8. Database Supabase

### 8.1 `markets`

Menyimpan daftar pasaran dan history result.

Minimal field:

```sql
create table if not exists markets (
  id text primary key,
  name text,
  history_data text,
  "order" int,
  updated_at timestamptz
);
```

Keterangan:

- `id`: kode market, misalnya `CHINA`, `SGP`, atau kode lain.
- `name`: nama market yang ditampilkan ke user.
- `history_data`: string berisi daftar result 4 digit, dipisahkan newline/spasi/koma.
- `order`: urutan tampil di dashboard.
- `updated_at`: waktu update terakhir.

Input history harus berupa angka 4 digit. Minimal 17 result valid agar engine bisa berjalan.

### 8.2 `trial_activations_v2`

Menyimpan aktivasi trial.

```sql
create table if not exists trial_activations_v2 (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  display_code text not null,
  activated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ip_hash text,
  user_agent text,
  user_agent_hash text,
  fingerprint_hash text,
  trial_block_reason text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists trial_activations_v2_display_code_idx
on trial_activations_v2 (display_code);

create index if not exists trial_activations_v2_expires_at_idx
on trial_activations_v2 (expires_at);

create index if not exists trial_activations_v2_ip_hash_idx
on trial_activations_v2 (ip_hash);

create index if not exists trial_activations_v2_fingerprint_hash_idx
on trial_activations_v2 (fingerprint_hash);
```

Catatan: beberapa kolom seperti `user_agent_hash`, `fingerprint_hash`, dan `trial_block_reason` dipakai oleh kode trial hardening. Pastikan schema production memilikinya.

### 8.3 `pin_auth_attempts`

Menyimpan attempt login PIN PRO/MASTER.

```sql
create table if not exists pin_auth_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  device_id text,
  display_code text,
  success boolean not null default false,
  reason text,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_pin_auth_attempts_ip_time
on pin_auth_attempts(ip_hash, attempted_at);

create index if not exists idx_pin_auth_attempts_device_time
on pin_auth_attempts(device_id, attempted_at);

create index if not exists idx_pin_auth_attempts_display_time
on pin_auth_attempts(display_code, attempted_at);
```

### 8.4 `analysis_evaluations`

Dipakai untuk riwayat evaluasi yang ditampilkan di halaman hasil analisa.

Field yang dibaca frontend:

```sql
id
market_id
mode
param
position
target_pair
analysis_scope
from_result
new_result
is_hit
status
detail
evaluated_at
```

Minimal schema yang disarankan:

```sql
create table if not exists analysis_evaluations (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  market_name text,
  mode text not null,
  param int not null,
  position text default 'all',
  target_pair text default 'belakang',
  analysis_scope text default 'default',
  from_result text,
  new_result text,
  is_hit boolean,
  status text,
  detail jsonb,
  evaluated_at timestamptz not null default now()
);

create index if not exists analysis_evaluations_lookup_idx
on analysis_evaluations(market_id, mode, param, position, target_pair, analysis_scope, evaluated_at desc);
```

Mode yang dipakai:

```text
ai
ai_parity
ai_size
bbfs
mati
jumlah
shio
```

Position yang dipakai:

```text
all
as
kop
kepala
ekor
```

Target pair:

```text
depan
tengah
belakang
```

Analysis scope:

```text
default
2d_depan
2d_tengah
2d_belakang
3d
4d
```

### 8.5 `analysis_snapshots`

Dipakai oleh evaluator/backtest process untuk menyimpan snapshot hasil analisa sebelum result baru masuk.

Field yang umum dipakai:

```sql
id
market_id
market_name
mode
param
position
target_pair
analysis_scope
base_result
result
payload
created_at
updated_at
```

Minimal schema yang disarankan:

```sql
create table if not exists analysis_snapshots (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  market_name text,
  mode text not null,
  param int not null,
  position text default 'all',
  target_pair text default 'belakang',
  analysis_scope text default 'default',
  base_result text,
  result jsonb,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(market_id, mode, param, position, target_pair, analysis_scope)
);
```

### 8.6 `market_statistics`

Dipakai oleh job/statistics process untuk ranking statistik market.

Field yang dibaca/ditulis oleh tooling statistik:

```text
stat_key
market_id
market_name
group_key
mode
param
position
target_pair
analysis_scope
wins_15
wins_last_5
score
previous_rank
is_active
```

Minimal schema yang disarankan:

```sql
create table if not exists market_statistics (
  id uuid primary key default gen_random_uuid(),
  stat_key text not null unique,
  market_id text not null,
  market_name text,
  group_key text,
  mode text,
  param int,
  position text,
  target_pair text,
  analysis_scope text default 'default',
  wins_15 int default 0,
  wins_last_5 int default 0,
  loss_streak int default 0,
  score int default 0,
  rank int,
  previous_rank int,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);
```

---

## 9. Halaman analisa: konsep UI/UX

### 9.1 Entry point

User masuk dari dashboard market ke:

```text
/analyze/:marketId
```

`AnalyzeMenu.tsx` menampilkan kartu pilihan:

- Angka Ikut
- BBFS
- Angka Mati
- Jumlah Mati
- Shio Mati
- Custom Rekap

Setiap mode memiliki warna aksen dan icon berbeda.

### 9.2 Core page

`AnalysisPageV3Core.tsx` mengatur:

- Back navigation bertahap.
- Auto mode dari query string.
- Ambil market history dari `/api/markets`.
- Validasi minimal 17 result.
- Pemilihan scope/fokus.
- Pemilihan param.
- Request ke `/api/analyze`.
- Loading, error, dan result state.
- Custom Rekap builder.

### 9.3 Scope dan target pair

Target pair:

```text
depan     AS - KOP
tengah    KOP - KEPALA
belakang  KEPALA - EKOR
```

Analysis scope:

```text
2d_depan      AS - KOP
2d_tengah     KOP - KEPALA
2d_belakang   KEPALA - EKOR
3d            KOP - KEPALA - EKOR
4d            AS - KOP - KEPALA - EKOR
```

### 9.4 Mode `ai`

Flow:

1. User pilih jenis Angka Ikut: 2D depan/tengah/belakang, 3D, atau 4D.
2. User pilih param.
3. Frontend kirim ke `/api/analyze`.
4. Result tampil sebagai Hasil Utama + Detail Validasi + Riwayat Evaluasi.

Param AI:

```text
AI 2D: 2, 4, 6, 7, 8
AI 3D: 1, 3, 5, 7, 8
AI 4D: 1, 2, 4
```

Keterangan:

- Param 7 = Ganjil / Genap.
- Param 8 = Besar / Kecil.

### 9.5 Mode `bbfs`

Flow:

1. User pilih jenis BBFS: 2D depan/tengah/belakang, 3D, atau 4D.
2. User pilih jumlah digit BBFS: 7, 8, atau 9.
3. Frontend kirim type `bbfs` ke `/api/analyze`.
4. Backend menjalankan engine AI dengan `forceDigitResult` agar output berupa digit BBFS.

Param BBFS:

```text
7
8
9
```

### 9.6 Mode `mati`

Flow:

1. User pilih jumlah digit OFF: 1, 2, atau 3.
2. Backend menghitung OFF untuk posisi:
   - AS
   - KOP
   - KEPALA
   - EKOR
3. Frontend menampilkan hasil per posisi.
4. Riwayat evaluasi ditampilkan per tab posisi.

### 9.7 Mode `jumlah`

Flow:

1. User pilih fokus 2D: depan/tengah/belakang.
2. User pilih jumlah OFF: 1, 2, atau 3.
3. Backend menjalankan engine jumlah mati.

### 9.8 Mode `shio`

Flow:

1. User pilih fokus 2D: depan/tengah/belakang.
2. User pilih jumlah shio mati: 1, 2, atau 3.
3. Backend menjalankan engine shio mati.

### 9.9 Mode `rekap`

Custom Rekap adalah builder untuk meracik line dari kombinasi beberapa filter.

Flow besar:

1. User pilih fokus rekap: 2D, 3D, atau 4D.
2. User memilih filter yang ingin dipakai.
3. Frontend menjalankan beberapa request ke `/api/analyze` sesuai filter.
4. `buildCustomDigitLines()` merakit hasil akhir menjadi line.
5. User bisa copy semua line.

Catatan teknis:

- Mode ini saat ini lebih kompleks daripada mode analisa standar.
- Banyak request dilakukan dari frontend.
- Kandidat refactor: pindahkan orkestrasi custom rekap ke endpoint backend tunggal agar lebih cepat, stabil, dan mudah dites.

### 9.10 Result UI terbaru

Hasil analisa ditampilkan dengan struktur:

1. Card Hasil Utama.
2. Card Detail Validasi.
3. Panel Angka Jadi jika tersedia.
4. Riwayat Evaluasi.

Catatan layout terbaru:

- Card `VALIDASI` terpisah sudah dihapus.
- `RUMUS ACTIVE x/x` sekarang digabung ke header `DETAIL VALIDASI`, di samping tombol `BUKA`.

---

## 10. API reference

### 10.1 `POST /api/trial`

Aktivasi trial.

Input utama:

```json
{
  "deviceId": "string",
  "displayCode": "123456",
  "fingerprint": {}
}
```

Output sukses:

```json
{
  "success": true,
  "role": "TRIAL",
  "token": "jwt",
  "expiresAt": "iso-date"
}
```

### 10.2 `POST /api/auth`

Login PRO/MASTER via PIN.

Input:

```json
{
  "pin": "123456",
  "deviceId": "string",
  "displayCode": "123456"
}
```

Output sukses:

```json
{
  "success": true,
  "role": "PRO",
  "token": "jwt"
}
```

atau:

```json
{
  "success": true,
  "role": "MASTER",
  "token": "jwt"
}
```

Kemungkinan error:

- `401` jika PIN salah atau payload invalid.
- `429` jika terlalu banyak percobaan.
- `500` jika konfigurasi/env/server bermasalah.

### 10.3 `POST /api/verify`

Verifikasi token login.

Input:

```json
{
  "token": "jwt",
  "deviceId": "string"
}
```

Output sukses:

```json
{
  "valid": true,
  "role": "TRIAL|PRO|MASTER",
  "displayCode": "123456"
}
```

### 10.4 `GET /api/markets`

Mengambil daftar market.

Output umum:

```json
[
  {
    "id": "CHINA",
    "name": "CHINA POOLS",
    "history_data": "1234\n5678",
    "order": 1,
    "updated_at": "iso-date"
  }
]
```

### 10.5 `POST /api/analyze`

Endpoint analisa utama.

Header:

```text
Authorization: Bearer <token>
```

Input:

```json
{
  "type": "ai",
  "data": ["1234", "5678"],
  "param": 2,
  "target_pair": "belakang",
  "analysis_scope": "default"
}
```

Validasi:

- Method harus POST.
- Token harus valid, kecuali internal request memakai `x-internal-secret` yang cocok dengan `INTERNAL_API_SECRET`.
- `type` harus salah satu dari:

```text
ai
bbfs
mati
jumlah
shio
rekap
```

- `data` harus array result 4 digit, minimal 17 item valid.
- `param` harus valid sesuai mode.
- `analysis_scope` harus valid.
- `target_pair` fallback ke `belakang` jika invalid.

Output sukses bervariasi per mode, tetapi biasanya:

```json
{
  "success": true,
  "data": {
    "result": [],
    "stats": []
  },
  "target_pair": "belakang",
  "analysis_scope": "default"
}
```

### 10.6 `POST /api/admin`

Admin action.

Header:

```text
Authorization: Bearer <MASTER token>
```

Action:

```json
{ "action": "save", "marketId": "CHINA", "historyData": "1234\n5678" }
```

```json
{ "action": "delete", "marketId": "CHINA" }
```

```json
{ "action": "add", "marketId": "CHINA", "order": 1 }
```

```json
{ "action": "reorder", "markets": [{ "id": "CHINA", "order": 1 }] }
```

Catatan keamanan untuk reviewer:

- Pastikan `api/admin.ts` tetap hanya boleh diakses role `MASTER`.
- Idealnya validasi admin disamakan dengan `/api/verify`, termasuk `tokenVersion` dan device binding.

---

## 11. Prediction engine overview

File utama:

```text
api/predictionEngine.ts
```

Engine ini menerima:

```ts
runAnalysis(type, payload, param, options)
```

Parameter:

- `type`: mode analisa.
- `payload`: array history result 4 digit.
- `param`: jumlah digit / jenis analisa.
- `options.analysisScope`: default, 2D, 3D, atau 4D.
- `options.targetPair`: depan/tengah/belakang.
- `options.forceDigitResult`: dipakai BBFS agar AI engine mengeluarkan digit count spesifik.

Index target:

```text
4d          [0, 1, 2, 3]
3d          [1, 2, 3]
2d_depan    [0, 1]
2d_tengah   [1, 2]
2d_belakang [2, 3]
default     mengikuti target_pair
```

Mapping posisi 4D:

```text
index 0 = AS
index 1 = KOP
index 2 = KEPALA
index 3 = EKOR
```

Minimal data:

- UI dan API meminta minimal 17 result valid.
- Banyak validasi internal memakai 14 window evaluasi dari 17 result terakhir.

---

## 12. Generator PIN VIP

Generator PIN VIP harus memakai `PIN_SECRET` yang sama dengan Vercel.

Contoh Python:

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

Aturan:

- Role prefix PRO harus string persis `PRO`.
- Input device key harus display code 6 digit.
- Jangan kirim `PIN_SECRET` ke client.
- Jangan simpan PIN mentah di database.

---

## 13. Menjalankan lokal

Install dependency:

```bash
npm install
```

Buat `.env.local` berisi env frontend dan backend yang dibutuhkan.

Contoh:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
JWT_SECRET=change-me
TOKEN_VERSION=2
PIN_SECRET=change-me
MASTER_PIN=123456
INTERNAL_API_SECRET=change-me
```

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

Catatan:

- Script `lint` saat ini menjalankan `tsc --noEmit`.
- Nama script bukan ESLint murni.

---

## 14. Deploy

Target deploy utama: Vercel.

Langkah umum:

1. Push ke branch `main`.
2. Vercel auto-build.
3. Pastikan semua env backend dan frontend sudah di-set di Vercel Project Settings.
4. Pastikan Supabase schema sudah sesuai.
5. Jalankan smoke test login dan analisa.

Build command:

```bash
npm run build
```

Preview command lokal:

```bash
npm run preview
```

---

## 15. Operasional admin

### 15.1 Aktivasi VIP

1. User buka aplikasi.
2. User melihat Device Key 6 digit.
3. User mengirim Device Key ke admin.
4. Admin generate PIN VIP dengan generator yang memakai `PIN_SECRET` sama seperti Vercel.
5. User klik `Saya Punya PIN VIP`.
6. User memasukkan PIN.
7. Jika valid, user mendapat token role `PRO` selama 60 hari.

### 15.2 Update history result

1. Admin login sebagai MASTER.
2. Buka `/admin`.
3. Pilih market.
4. Masukkan data result 4 digit.
5. Sistem menormalisasi data menjadi newline list.
6. Minimal 17 result valid.
7. Simpan ke database.

Urutan data wajib:

```text
atas/kiri = lama
bawah/kanan = terbaru
```

Result terakhir akan dipakai engine sebagai result terbaru.

### 15.3 Reorder market

Admin dapat mengubah urutan market. Field yang diubah:

```text
markets.order
```

### 15.4 Delete market

Delete market menghapus row dari tabel `markets`. Pastikan ini memang diinginkan karena history_data ikut hilang dari tabel utama.

---

## 16. Keamanan

Prinsip utama:

- Jangan commit secret.
- Jangan expose service role key ke frontend.
- Jangan tampilkan `deviceId` rahasia ke user.
- Jangan simpan PIN mentah.
- Jangan log token JWT.
- Jangan kirim error detail sensitif ke user.

Current security controls:

- Trial memakai fingerprint/IP/user-agent hash.
- PIN auth memakai Supabase rate limiter.
- JWT berisi token version.
- Verify token mengecek device binding.
- Trial token dicek ulang ke database.
- API analyze mengecek role dan token version.

Known security note:

- `api/admin.ts` harus tetap diperhatikan. Untuk hardening lebih lanjut, samakan validasinya dengan `api/verify.ts` atau helper shared auth: cek `tokenVersion`, role `MASTER`, dan device binding.

Mass logout:

1. Naikkan `TOKEN_VERSION` di env.
2. Deploy ulang.
3. Semua token lama invalid karena `tokenVersion` tidak cocok.

---

## 17. Testing checklist

### Auth

- Trial baru berhasil mendapat role `TRIAL`.
- Trial lama yang expired ditolak.
- PRO PIN valid berhasil login.
- MASTER PIN valid berhasil login.
- PIN salah mengembalikan error netral.
- 5 PIN salah dalam 15 menit kena HTTP 429.
- Logout menghapus token tetapi tidak menghapus Device Key.
- Token lama invalid setelah `TOKEN_VERSION` dinaikkan.

### Admin

- Non-MASTER tidak bisa buka `/admin`.
- MASTER bisa tambah market.
- MASTER bisa save history result.
- MASTER bisa delete market.
- MASTER bisa reorder market.
- Input history invalid dibuang/ditolak.
- Minimal 17 result valid dipaksa sebelum save/analisa.

### Analisa

- AI 2D depan/tengah/belakang berjalan.
- AI 3D berjalan.
- AI 4D berjalan.
- BBFS 2D/3D/4D berjalan.
- Mati menampilkan AS/KOP/KEPALA/EKOR.
- Jumlah meminta target pair dan menampilkan hasil.
- Shio meminta target pair dan menampilkan chip shio.
- Rekap custom bisa generate line dan copy semua.
- Detail Validasi bisa dibuka/tutup.
- Riwayat Evaluasi muncul jika data tersedia.

### UI/UX

- Mobile viewport tidak overflow horizontal.
- Tombol utama cukup besar untuk touch.
- Loading state muncul saat proses.
- Error state jelas.
- Back button bertahap bekerja.
- Reduced motion tetap aman.

---

## 18. Catatan untuk reviewer GPT / AI lain

Baca urutan ini agar cepat paham project:

1. `src/App.tsx` untuk root route, auth gate, dan dashboard.
2. `src/components/LoginGate.tsx` untuk login trial/PIN.
3. `api/trial.ts`, `api/auth.ts`, `api/verify.ts` untuk sistem auth.
4. `src/pages/AnalyzeMenu.tsx` untuk menu analisa.
5. `src/pages/AnalysisPageV3Core.tsx` untuk flow utama halaman analisa.
6. `src/components/analysis/ParamSelector.tsx` dan `ScopeSelectors.tsx` untuk pilihan user.
7. `api/analyze.ts` untuk validasi request analisa.
8. `api/predictionEngine.ts` untuk logic engine utama.
9. `src/components/analysis/AnalysisResult.tsx` untuk tampilan hasil.
10. `src/components/EvaluationHistory.tsx` untuk riwayat evaluasi.
11. `src/pages/AdminPage.tsx` dan `api/admin.ts` untuk admin.

Hal yang jangan disalahpahami:

- `displayCode` adalah Device Key 6 digit untuk user/admin, bukan secret internal penuh.
- `deviceId` adalah secret browser-side yang tidak boleh ditampilkan ke user.
- PRO PIN dibuat dari `displayCode + "PRO"`, bukan dari `deviceId`.
- Trial tidak memakai PIN.
- Minimal data analisa adalah 17 result valid.
- `analysis_scope` menentukan 2D/3D/4D target index.
- Untuk AI 2D, frontend dapat mengirim scope `default` dengan `target_pair`; riwayat evaluasi punya fallback untuk compatibility lama.
- BBFS memakai engine AI dengan mode khusus agar output berupa 7/8/9 digit.
- Card `VALIDASI` terpisah sudah dihapus; `RUMUS ACTIVE` ada di header `DETAIL VALIDASI`.

Area yang layak direfactor berikutnya:

1. Buat shared auth helper untuk `api/analyze.ts`, `api/verify.ts`, dan `api/admin.ts`.
2. Buat endpoint market tunggal agar halaman analisa tidak perlu fetch semua market.
3. Pindahkan custom rekap orchestration ke backend supaya tidak banyak request dari frontend.
4. Pecah `AnalysisPageV3Core.tsx` menjadi hook dan subcomponent agar lebih mudah dirawat.
5. Tambahkan automated test untuk auth, rate limiter, dan API analyze.
6. Tambahkan migration SQL resmi untuk semua tabel.

---

## 19. Naming note

Repo saat ini bernama:

```text
backup-
```

Package name di `package.json` saat ini masih:

```text
react-example
```

Untuk production/portfolio, sebaiknya rename repo dan package ke nama produk yang jelas, misalnya:

```text
analisa-angka
```

atau nama brand final.

---

## 20. Status saat ini

- Auth trial aktif.
- PRO/MASTER PIN aktif.
- PIN rate limiter sudah memakai Supabase.
- Issue rate limiter sudah closed sebagai completed.
- Halaman analisa v3 aktif.
- Layout validasi terbaru sudah menggabungkan `RUMUS ACTIVE` ke card Detail Validasi.
- README ini adalah sumber konteks utama untuk review cepat.
