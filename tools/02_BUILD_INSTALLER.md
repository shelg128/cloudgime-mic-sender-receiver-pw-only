# 🔨 Build Installer Windows (.exe)

## Langkah Build — Sentinel Mic Sender (Windows)

```powershell
# 1. Masuk ke folder source sender
cd source\mic-sender-android-windows

# 2. Install dependencies (hanya perlu sekali, atau setelah update package.json)
npm install

# 3. Build installer Windows NSIS (.exe)
npm run build:desktop
```

Output akan muncul di:
```
mic-sender-android-windows\dist-desktop\Sentinel Mic Sender Setup 1.0.0.exe
```

---

## Langkah Build — Sentinel Mic Receiver (Windows)

```powershell
# 1. Masuk ke folder source receiver
cd source\mic-receiver-windows

# 2. Install dependencies
npm install

# 3. Build installer Windows NSIS (.exe)
npm run build:desktop
```

Output akan muncul di:
```
mic-receiver-windows\dist-desktop\Sentinel Mic Receiver Setup 1.0.0.exe
```

---

## Penjelasan Script npm

| Script | Perintah asli | Keterangan |
|--------|--------------|------------|
| `npm run build` | `tsc -b && vite build` | Build web (React) saja |
| `npm run build:desktop` | `npm run build && electron-builder --win` | Build web + bungkus Electron + buat installer NSIS |

---

## Konfigurasi Installer (di package.json)

```json
"build": {
  "appId": "com.sentinel.micsender",
  "productName": "Sentinel Mic Sender",
  "directories": { "output": "dist-desktop" },
  "win": { "target": "nsis" },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

Untuk ganti nama/versi, edit bagian `"version"` dan `"productName"` di `package.json`.

---

## ⚠️ Catatan Penting

- Build harus dilakukan di **Windows** (electron-builder butuh NSIS yang hanya ada di Windows)
- Pastikan `node_modules` sudah di-install (`npm install`) sebelum build
- Jika error saat build, coba hapus folder `dist/` dan `dist-desktop/` lalu build ulang:
  ```powershell
  Remove-Item -Recurse -Force dist, dist-desktop
  npm run build:desktop
  ```
