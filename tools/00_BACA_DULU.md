# 📦 Sentinel Mic — Panduan Arsip Lengkap

> **Dibuat:** 2026-06-10  
> **Versi:** 1.0.0  
> **Proyek:** Sentinel Mic Sender (Android + Windows) + Sentinel Mic Receiver (Windows)

---

## 📁 Isi Arsip Ini

```
sentinel-mic-v1.0.0-source.zip
│
├── source/
│   ├── mic-sender-android-windows/     ← Proyek Sender (React + Electron + Capacitor)
│   └── mic-receiver-windows/           ← Proyek Receiver (React + Electron)
│
├── installers/
│   ├── Sentinel-Mic-Sender-Setup-1.0.0.exe     ← Installer Windows Sender FINAL
│   ├── Sentinel-Mic-Sender-Android-1.0.0.apk   ← APK Android Sender FINAL
│   └── Sentinel-Mic-Receiver-Setup-1.0.0.exe   ← Installer Windows Receiver FINAL
│
└── tools/
    ├── 00_BACA_DULU.md          ← File ini
    ├── 01_REQUIREMENTS.md       ← Kebutuhan sistem & software
    ├── 02_BUILD_INSTALLER.md    ← Cara build installer dari source
    ├── 03_BUILD_APK_ANDROID.md  ← Cara build APK Android
    ├── 04_LIVE_TEST.md          ← Cara live test / dev mode
    ├── 05_TROUBLESHOOTING.md    ← Solusi masalah umum
    └── 06_PINDAH_PC.md         ← Checklist pindah ke PC baru
```

---

## 🚀 Cara Cepat Mulai di PC Baru

1. Install semua requirements → lihat `01_REQUIREMENTS.md`
2. Extract folder `source/` ke direktori kerja Anda
3. Buka terminal di folder masing-masing proyek
4. Jalankan `npm install`
5. Untuk langsung pakai: install dari folder `installers/`

---

## ⚠️ Penting

- **JANGAN** hapus folder `source/` — ini adalah kode asli yang bisa di-rebuild
- Installer di folder `installers/` adalah build **FINAL v1.0.0**
- Untuk update/perbaikan, selalu rebuild dari source, jangan edit installer
