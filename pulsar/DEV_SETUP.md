# Dev Environment Setup

## Running the App

```bash
npm run ios
```

This starts the Metro bundler and launches the app in the iOS simulator. The dev client must already be installed on the simulator (see below).

---

## Prerequisites & Known Issues

### macOS 13 (Ventura) + Xcode 15 Incompatibility

This project uses React Native 0.81.5 and react-native-reanimated 4.x, both of which require **Xcode 16.1+**. Xcode 16 requires macOS 14 (Sonoma).

**If you are on macOS 13, local native builds will fail.** You will hit two errors:
1. `Please upgrade XCode` — enforced in `react-native/scripts/cocoapods/helpers.rb`
2. C++20 compiler errors in reanimated/Yoga pods — Xcode 15's SDK doesn't support the C++20 features used by reanimated 4.x

### Solution: EAS Cloud Builds

Use Expo's cloud build service to compile the native binary. Their servers run Xcode 16. You only need to do this once (or when native dependencies change).

**One-time setup:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build the simulator binary in the cloud (~10-15 min)
eas build --platform ios --profile development --non-interactive

# Download the build (replace <build-id> with the ID from the output above)
eas build:download --build-id <build-id> --non-interactive

# Install onto the booted simulator
xcrun simctl install booted /path/to/downloaded.app
```

After the app is installed on the simulator once, `npm run ios` works normally for all day-to-day development.

### Node.js Location

Node is not installed globally. It lives in `.tools/node-v22.14.0-darwin-x64/bin/`. If running commands outside of npm scripts, prefix with:

```bash
export PATH="/path/to/project/.tools/node-v22.14.0-darwin-x64/bin:$PATH"
```

### CocoaPods

CocoaPods was installed via rbenv (Ruby 3.3.0). The system Ruby (2.6.0) on macOS 13 is write-protected and cannot be used directly. Running `pod install` requires rbenv to be initialized:

```bash
eval "$(rbenv init -)"
export LANG=en_US.UTF-8
export SSL_CERT_FILE=/usr/local/etc/ca-certificates/cert.pem
pod install
```

The SSL cert env var is required due to macOS 13's outdated system certificates.

### `newArchEnabled` Must Stay `true`

`app.json` must have `"newArchEnabled": true`. Setting it to `false` breaks `react-native-reanimated` 4.x which requires New Architecture.
