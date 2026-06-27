# ⚡ Live Test / Development Mode

## Cara Menjalankan dalam Mode Development

### Sender — Mode Browser (paling cepat)

```powershell
cd source\mic-sender-android-windows
npm install     # hanya sekali
npm run dev
```

Buka browser → `http://localhost:5173`

---

### Sender — Mode Desktop Electron (live reload)

```powershell
cd source\mic-sender-android-windows
npm run dev:desktop
```

Ini akan membuka **jendela Electron** langsung + reload otomatis setiap kali Anda ubah source code.

---

### Receiver — Mode Browser

```powershell
cd source\mic-receiver-windows
npm install     # hanya sekali
npm run dev
```

Buka browser → `http://localhost:5173`

> ⚠️ Jika **Sender juga running di port 5173**, ubah port di `vite.config.ts` salah satunya:
> ```typescript
> export default defineConfig({
>   server: { port: 5174 }
> })
> ```

---

### Receiver — Mode Desktop Electron (live reload)

```powershell
cd source\mic-receiver-windows
npm run dev:desktop
```

---

## Test Sender + Receiver Bersamaan

1. **Terminal 1** — Jalankan Receiver dulu:
   ```powershell
   cd source\mic-receiver-windows
   npm run dev:desktop
   ```

2. **Terminal 2** — Jalankan Sender:
   ```powershell
   cd source\mic-sender-android-windows
   npm run dev:desktop
   ```

3. Di **Sender**, masukkan IP PC yang menjalankan Receiver
4. Klik **Connect** dan test audio stream

---

## Test Sender di Android (Hot Reload)

```powershell
cd source\mic-sender-android-windows

# 1. Build web dulu
npm run build

# 2. Sync ke Android
npx cap sync android

# 3. Buka di Android Studio dengan live reload
npx cap run android --livereload --external
```

Atau buka Android Studio → Run (tombol ▶)

---

## Tips Live Test Jaringan Lokal

| Perangkat | Keterangan |
|-----------|-----------|
| Sender (Android/Windows) | Perlu tahu IP PC Receiver |
| Receiver (Windows) | Jalankan dulu, catat IP-nya |

Cari IP PC Receiver:
```powershell
ipconfig
# Lihat "IPv4 Address" di adapter WiFi/Ethernet
```

---

## Port yang Digunakan

| Layanan | Port Default |
|---------|-------------|
| Vite Dev Server | 5173 |
| WebSocket Audio (Receiver) | Lihat di `electron/main.cjs` |
