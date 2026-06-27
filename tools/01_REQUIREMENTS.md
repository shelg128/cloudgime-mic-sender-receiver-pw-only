# 🖥️ Requirements — Kebutuhan Sistem & Software

## Sistem Operasi
- **Windows 10/11 64-bit** (untuk build Electron + installer NSIS)
- **macOS / Linux** bisa untuk build web saja, tapi installer `.exe` hanya bisa di Windows

---

## Software Wajib Install

### 1. Node.js (v20 LTS atau lebih baru)
- Download: https://nodejs.org/en/download
- Pilih: **Windows Installer (.msi) — LTS**
- Setelah install, verifikasi:
  ```
  node --version    # harus v20.x atau lebih baru
  npm --version     # harus v10.x atau lebih baru
  ```

### 2. Git (opsional, untuk clone repo)
- Download: https://git-scm.com/download/win

### 3. Android Studio (hanya untuk build APK)
- Download: https://developer.android.com/studio
- Setelah install, buka Android Studio → SDK Manager → Install:
  - Android SDK Platform 35
  - Android SDK Build-Tools
  - Android SDK Command-line Tools
  - Android Emulator (jika mau test di emulator)

### 4. Java JDK 17 (untuk build Android)
- Download: https://adoptium.net/
- Pilih: **Temurin 17 LTS**
- Set environment variable:
  ```
  JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot
  ```

---

## Cek Versi Tools

Jalankan di PowerShell/CMD setelah install semua:

```powershell
node --version
npm --version
java --version
# Untuk Android:
echo $env:ANDROID_HOME
echo $env:JAVA_HOME
```

---

## Environment Variables Android (Tambahkan ke System PATH)

Buka: **Control Panel → System → Advanced → Environment Variables**

| Variable | Value (contoh) |
|----------|---------------|
| `ANDROID_HOME` | `C:\Users\Admin\AppData\Local\Android\Sdk` |
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot` |

Tambahkan ke **PATH**:
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\tools`
- `%JAVA_HOME%\bin`
