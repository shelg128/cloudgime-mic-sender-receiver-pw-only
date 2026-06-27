# 📱 Build APK Android

## Overview

Proyek **Sentinel Mic Sender** menggunakan **Capacitor** untuk membungkus web app menjadi APK Android.

---

## Langkah Build APK (dari awal)

### Step 1 — Build Web App Dulu

```powershell
cd source\mic-sender-android-windows
npm install
npm run build
```

### Step 2 — Sync ke Capacitor Android

```powershell
npx cap sync android
```

Perintah ini meng-copy hasil build web ke dalam project Android di folder `android/`.

### Step 3 — Build APK via Gradle

```powershell
cd android
.\gradlew assembleDebug
```

APK Debug akan muncul di:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

### Step 4 — Build APK Release (untuk distribusi)

```powershell
.\gradlew assembleRelease
```

APK Release (unsigned) akan muncul di:
```
android\app\build\outputs\apk\release\app-release-unsigned.apk
```

---

## Build APK dari Android Studio (Cara GUI)

1. Buka **Android Studio**
2. **File → Open** → pilih folder `source\mic-sender-android-windows\android`
3. Tunggu Gradle sync selesai
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. Klik **locate** setelah build selesai untuk menemukan file APK

---

## Install APK ke HP Android

### Via USB:
```powershell
# Pastikan USB Debugging aktif di HP
adb install path\ke\file.apk
```

### Manual:
1. Copy APK ke HP via USB/WhatsApp
2. Di HP: Buka file manager → tap APK → Install
3. Aktifkan "Install from unknown sources" jika diminta

---

## Capacitor Config (capacitor.config.ts)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sentinel.micsender',
  appName: 'Sentinel Mic Sender',
  webDir: 'dist'
};
```

---

## ⚠️ Catatan Penting

- Pastikan `JAVA_HOME` dan `ANDROID_HOME` sudah diset (lihat `01_REQUIREMENTS.md`)
- APK di folder `installers/` arsip ini sudah siap pakai (sudah dibuild)
- APK debug tidak perlu signing, tapi untuk distribusi production perlu keystore
