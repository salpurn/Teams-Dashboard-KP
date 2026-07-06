# Teams Document Tracker Backend

Backend FastAPI untuk menerima pesan Microsoft Teams yang berisi dokumen, menyimpan metadata dokumen, lalu melacak level review, manager penanggung jawab, SLA, dan notifikasi tanpa menulis pesan balik ke Teams.

## Fitur awal

- Master user internal dengan data nama, jabatan, unit, region, email Teams, dan status aktif.
- Ingest pesan Teams berisi dokumen dari webhook/sync Microsoft Graph (read-only, tanpa kirim pesan balik).
- Tracking dokumen per level review: `waiting`, `in_review`, `approved`, `rejected`, `returned`, `skipped`.
- Penyimpanan metadata attachment/dokumen seperti `document_id`, nama file, tipe file, URL Teams/SharePoint, dan preview URL.
- Admin dapat mengelola master user, level review, manager per level, dan SLA global.
- Notifikasi tersimpan di backend dan bisa dibaca lewat page notifikasi.
- Pesan webhook Teams bisa diproses otomatis:
  - pesan dokumen baru => membuat tracker project + level awal + manager aktif,
  - pesan balasan review (contoh: "oke, sudah review") => update approval level aktif.
- Endpoint webhook Graph dengan validasi `validationToken`.
- Seed data contoh user berdasarkan workflow legal/review kontrak.

## Menjalankan lokal

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

## Menghubungkan ke Supabase

1. Buat project Supabase dan ambil connection string PostgreSQL.
2. Set `DATABASE_URL` ke Supabase, misalnya:

```text
postgresql+psycopg2://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

3. Jalankan app; tabel akan dibuat otomatis oleh `Base.metadata.create_all(...)`.
4. Jalankan `scripts/seed.py` kalau ingin isi data awal user dan review level.

Dokumentasi API tersedia di:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

## Alur data utama

1. Pesan masuk dari channel/thread Teams berisi teks, mention, dan attachment dokumen.
2. Backend mencocokkan mention/recipient dengan master user.
3. Sistem membuat tracker dokumen, level aktif, dan manager penanggung jawab.
4. Status review bergerak dari `waiting` ke `in_review`, lalu `approved`, `rejected`, atau `returned`.
5. Dashboard/frontend dapat membaca daftar dokumen, level aktif, manager, SLA, dan notifikasi dari endpoint API.

Endpoint bantu manual intake (opsional):

- `POST /api/v1/tracker/intake/messages/{message_id}`

## Skenario uji end-to-end

### 1) Ingest pesan dari Teams webhook

`POST /api/v1/graph/webhook`

Hasil: backend mengambil detail pesan dari Graph API, menyimpan message + attachment untuk tracking internal, lalu memprosesnya ke tracker.

### 2) (Opsional) Trigger intake manual untuk message yang sudah tersimpan

`POST /api/v1/tracker/intake/messages/{message_id}`

Hasil: project tracker dibuat/diupdate sesuai isi message thread.

### 3) Cek tracker by document id

`GET /api/v1/tracker/projects/by-document/doc-e2e-001`

## Integrasi Microsoft Teams

Microsoft Teams menggunakan Microsoft Graph. Untuk production, buat app registration di Azure dan isi `.env`:

- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_WEBHOOK_CLIENT_STATE`

Endpoint callback webhook:

```text
POST /api/v1/graph/webhook
```

Catatan: Microsoft Graph webhook umumnya hanya mengirim notifikasi perubahan. Backend tetap perlu memanggil Graph API untuk mengambil detail pesan dan attachment. Backend ini hanya tracking/read-only terhadap pesan Teams; tidak mengirim pesan baru ke channel/thread Teams.

## Push notification ke perangkat/browser (FCM)

Backend sudah mendukung kirim push native (Android/iOS/Web dengan token FCM) saat notifikasi dibuat.

Isi `.env`:

- `FCM_SERVER_KEY`
- `FCM_API_URL` (opsional, default `https://fcm.googleapis.com/fcm/send`)

Daftarkan token perangkat user:

```text
POST /api/v1/tracker/device-tokens
```

Kirim test push manual:

```text
POST /api/v1/tracker/notifications/test
```

Contoh body:

```json
{
  "user_email": "putu.wahyu@example.com",
  "title": "Test push",
  "body": "Notifikasi push dari tracker backend",
  "data": {
    "source": "manual-test"
  }
}
```

Jika push berhasil maka `push_status` pada notification akan bernilai `sent`, jika gagal `failed`, jika tidak ada konfigurasi/token aktif maka `null`.
