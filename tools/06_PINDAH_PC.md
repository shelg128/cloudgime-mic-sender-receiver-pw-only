# 🖥️ Checklist Pindah PC Baru

> Ikuti urutan ini agar tidak ada yang terlewat saat pindah ke PC baru.

---

## ✅ Checklist Lengkap

### 1. Persiapan di PC Lama
- [ ] Pastikan arsip ZIP ini sudah disimpan di tempat aman (HDD eksternal, cloud, dll)
- [ ] Verifikasi ZIP bisa dibuka dan tidak corrupt
- [ ] Catat versi Node.js yang dipakai: `node --version`

---

### 2. Setup PC Baru — Software Wajib

- [ ] Install **Node.js LTS** → https://nodejs.org
- [ ] Install **Git** → https://git-scm.com (opsional tapi berguna)
- [ ] Install **VS Code** → https://code.visualstudio.com (editor disarankan)

**Jika perlu build Android:**
- [ ] Install **Android Studio** → https://developer.android.com/studio
- [ ] Install **Java JDK 17** → https://adoptium.net
- [ ] Set `ANDROID_HOME` environment variable
- [ ] Set `JAVA_HOME` environment variable
- [ ] Tambahkan ke PATH: `%ANDROID_HOME%\platform-tools`

---

### 3. Extract dan Setup Source

```powershell
# Extract ZIP ke folder kerja Anda, misalnya:
# C:\Projects\sentinel-mic\

# Masuk ke folder sender
cd C:\Projects\sentinel-mic\source\mic-sender-android-windows
npm install

# Masuk ke folder receiver
cd C:\Projects\sentinel-mic\source\mic-receiver-windows
npm install
```

---

### 4. Verifikasi Setup Berhasil

```powershell
# Test Sender bisa jalan
cd source\mic-sender-android-windows
npm run dev
# Harus buka browser di http://localhost:5173

# Test Receiver bisa jalan
cd source\mic-receiver-windows
npm run dev
# Harus buka browser di http://localhost:5173 (atau 5174)
```

---

### 5. Test Build Installer

```powershell
# Test bisa build installer
cd source\mic-sender-android-windows
npm run build:desktop
# Cek apakah file .exe muncul di dist-desktop\
```

---

## 📦 Apa yang TIDAK Perlu Di-copy dari PC Lama

Karena sudah ada di arsip ZIP ini, **tidak perlu**:
- ~~`node_modules/`~~ — akan di-install ulang dengan `npm install`
- ~~`dist/`~~ — akan di-build ulang
- ~~`dist-desktop/`~~ — installer final sudah ada di folder `installers/`
- ~~`.gradle/`~~ — akan di-download ulang oleh Gradle

---

## ☁️ Rekomendasi Backup Tambahan

Selain ZIP ini, pertimbangkan backup ke:

| Layanan | Keterangan |
|---------|-----------|
| **Google Drive** | Gratis 15GB, mudah akses dari mana saja |
| **OneDrive** | Terintegrasi Windows, auto-sync |
| **HDD Eksternal** | Paling aman, tidak tergantung internet |
| **GitHub (private repo)** | Khusus source code, version control |

---

## 🔑 File Penting yang Harus Dijaga

| File | Lokasi | Keterangan |
|------|--------|-----------|
| `package.json` | root masing-masing proyek | Konfigurasi build & dependencies |
| `electron/main.cjs` | `electron/` | Logic utama Electron (backend) |
| `src/App.tsx` | `src/` | Komponen React utama (frontend) |
| `capacitor.config.ts` | root sender | Konfigurasi Capacitor Android |
| `vite.config.ts` | root masing-masing | Konfigurasi bundler |

---

## 📞 Jika Ada Masalah

Lihat `05_TROUBLESHOOTING.md` untuk solusi masalah umum.
