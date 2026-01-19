# Projek RT Next.js Version

## Cara Menjalankan

1. Buka terminal di folder ini (`next-version`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
4. Jalankan server:
   ```bash
   npm run dev
   ```
5. Buka browser di [http://localhost:3000](http://localhost:3000).

## Catatan
- Project ini menggunakan database yang sama dengan versi sebelumnya (PostgreSQL di Neon).
- Data peserta akan tetap ada.
- Fitur sama persis dengan versi sebelumnya tapi dibangun dengan Next.js 14 (App Router) dan Prisma.
