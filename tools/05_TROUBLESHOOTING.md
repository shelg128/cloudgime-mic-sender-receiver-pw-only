# 🔧 Troubleshooting — Solusi Masalah Umum

---

## ❌ Error: `npm install` Gagal / EACCES

**Penyebab:** Permission issue di folder node_modules

**Solusi:**
```powershell
# Jalankan PowerShell sebagai Administrator
# Lalu coba lagi:
npm install
```

---

## ❌ Error: `electron-builder` Gagal saat Build

**Gejala:** `Error: Cannot find module 'electron'`

**Solusi:**
```powershell
# Hapus node_modules dan install ulang
Remove-Item -Recurse -Force node_modules
npm install
npm run build:desktop
```

---

## ❌ Error: Build Gagal karena TypeScript

**Gejala:** `tsc: error TS...`

**Solusi:**
```powershell
# Cek error TypeScript
npx tsc --noEmit

# Jika ingin skip TS check sementara (hanya untuk debug):
npx vite build
# Lalu manual: electron-builder --win
```

---

## ❌ Error: `ANDROID_HOME` Tidak Ditemukan

**Gejala saat build APK:** `SDK location not found`

**Solusi:**
1. Buka Android Studio
2. **File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. Catat path SDK-nya (misal: `C:\Users\Admin\AppData\Local\Android\Sdk`)
4. Set environment variable:
   ```powershell
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\Admin\AppData\Local\Android\Sdk", "User")
   ```
5. Restart terminal

---

## ❌ Error: `JAVA_HOME` Tidak Ditemukan

**Gejala saat build APK:** `ERROR: JAVA_HOME is not set`

**Solusi:**
```powershell
# Cek apakah Java sudah terinstall
java --version

# Set JAVA_HOME (sesuaikan path)
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot", "User")
```

---

## ❌ Electron App Tidak Bisa Akses Mikrofon

**Gejala:** Mikrofon tidak terdeteksi di Electron

**Solusi:** Di `electron/main.cjs`, pastikan ada:
```javascript
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
// atau:
session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
  if (permission === 'media') callback(true);
  else callback(false);
});
```

---

## ❌ Port 5173 Sudah Dipakai

**Gejala:** `Error: listen EADDRINUSE :::5173`

**Solusi — Ubah port di `vite.config.ts`:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174   // ganti ke port lain
  }
})
```

---

## ❌ Capacitor Sync Gagal

**Gejala:** `npx cap sync android` error

**Solusi:**
```powershell
# Rebuild web dulu
npm run build

# Lalu sync lagi
npx cap sync android

# Jika masih error, coba:
npx cap update android
npx cap sync android
```

---

## ❌ APK Tidak Bisa Diinstall di HP

**Gejala:** "App not installed" atau "Parse error"

**Solusi:**
1. Aktifkan **Install from Unknown Sources** di HP:
   - Settings → Security → Unknown Sources → ON
   - (Android 8+): Settings → Apps → Special App Access → Install Unknown Apps → pilih File Manager → Allow
2. Pastikan file APK tidak corrupt (coba copy ulang)
3. Coba build ulang APK

---

## ❌ Koneksi Sender-Receiver Gagal

**Gejala:** "Connection refused" atau tidak bisa connect

**Checklist:**
- [ ] Sender dan Receiver berada di **jaringan WiFi yang sama**
- [ ] IP yang dimasukkan di Sender sudah benar (cek dengan `ipconfig`)
- [ ] Receiver sudah dijalankan **lebih dulu** sebelum Sender connect
- [ ] **Windows Firewall** tidak memblokir port — tambahkan exception jika perlu:
  ```powershell
  # Buka PowerShell sebagai Admin
  New-NetFirewallRule -DisplayName "Sentinel Mic" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080
  ```
