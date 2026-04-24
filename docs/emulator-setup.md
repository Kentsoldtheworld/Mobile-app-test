# Pulsar Emulator Setup (macOS iOS + Windows Android)

This runbook standardizes local emulator setup for the Pulsar Expo app across:

- macOS + iOS Simulator
- Windows + Android Emulator

Project path assumptions:

- App root: `pulsar/`
- Commands are run from `pulsar/`

## 1) Shared prerequisites

Install on both operating systems:

- Node.js LTS (includes npm)
- Git

Verify:

```bash
node -v
npm -v
git --version
```

Install dependencies once per fresh clone:

```bash
npm install
```

## 2) macOS + iOS Simulator

### Required tools

- Xcode (from App Store)
- Xcode Command Line Tools
- iOS Simulator (bundled with Xcode)

Verify:

```bash
xcodebuild -version
```

If needed:

```bash
xcode-select --install
```

### Launch app on iOS simulator

From `pulsar/`:

```bash
npm run ios
```

Expected:

- Metro starts successfully
- iOS Simulator opens
- App launches in simulator

## 3) Windows + Android Emulator

### Required tools

- Android Studio
- Android SDK (via Android Studio)
- Android SDK Platform-Tools (includes `adb`)
- Android Emulator

### Environment variables (PowerShell)

Set these to your actual SDK location (default example shown):

```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

Ensure `platform-tools` is on PATH (User PATH):

```powershell
[System.Environment]::SetEnvironmentVariable(
  "Path",
  $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools",
  "User"
)
```

Restart terminal after updating env vars.

### Verify Android toolchain

```powershell
adb --version
echo $env:ANDROID_HOME
echo $env:ANDROID_SDK_ROOT
```

Start an AVD in Android Studio Device Manager, then verify device detection:

```powershell
adb devices
```

### Launch app on Android emulator

From `pulsar/`:

```powershell
npm run android
```

Expected:

- Expo prebuild/launch proceeds
- Emulator is discovered
- App installs/opens on emulator

## 4) Troubleshooting map

### Error: `Required property 'ios.bundleIdentifier' is not found`

Cause:

- `expo.ios.bundleIdentifier` missing in `app.json`

Fix:

- Ensure `pulsar/app.json` contains:
  - `expo.ios.bundleIdentifier = com.khd.pulsar`

### Error: `Failed to resolve the Android SDK path`

Cause:

- SDK not installed or env vars not set correctly

Fix:

- Install SDK in Android Studio
- Set `ANDROID_HOME` and `ANDROID_SDK_ROOT`
- Restart shell

### Error: `spawn adb ENOENT`

Cause:

- `adb` binary not available in PATH

Fix:

- Install Android SDK Platform-Tools
- Add `<SDK>/platform-tools` to PATH
- Restart shell and re-run `adb --version`

## 5) Canonical daily run commands

Use these from `pulsar/`:

```bash
npm run ios
npm run android
npm run start
```

These scripts resolve Expo locally via `npx` in `package.json`, reducing dependence on globally installed CLI binaries.
