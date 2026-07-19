# NanoChat — Setup & Run Guide

Complete instructions to build and run NanoChat on a physical iOS device.

## Prerequisites

- macOS with Xcode 16+ installed
- iPhone 12 or newer (A14 Bionic+) running iOS 15+
- Apple Developer account (free works for testing)
- Node.js 20+ and npm/yarn

---

## Step 1 — Install Dependencies

```bash
cd /Users/samsundar/.gemini/antigravity-ide/scratch/litert-lm-chat
npm install
```

---

## Step 2 — Add LiteRT-LM via Swift Package Manager

LiteRT-LM requires SPM setup after prebuild. Run prebuild first:

```bash
npx expo prebuild --platform ios
```

Then open the Xcode project and add the LiteRT-LM package:

1. Open `ios/litert-lm-chat.xcworkspace` in Xcode
2. File → Add Package Dependencies
3. Enter URL: `https://github.com/google-ai-edge/LiteRT-LM`
4. Select version: **latest stable**
5. Add to target: `litert-lm-chat`

---

## Step 3 — Fix Podfile (if needed)

If you encounter Swift interop errors, add this to `ios/Podfile`:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if target.name == 'NitroModules'
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_VERSION'] = '5.0'
      end
    end
    # Minimum iOS deployment target
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    end
  end
end
```

Then re-install pods:
```bash
cd ios && pod install && cd ..
```

---

## Step 4 — Run on Physical Device

Connect your iPhone via USB, then:

```bash
npx expo run:ios --device
```

Or from Xcode: select your device from the scheme menu → ▶ Run

> **Important**: You must use a physical device. The iOS Simulator does not support Metal GPU compute required by LiteRT-LM.

---

## Step 5 — First Launch

1. App opens to **Onboarding** screen
2. Select **Gemma 4 2B INT4** (recommended)
3. Tap **Download Model** — wait for ~1.4 GB download
4. Model loads automatically into GPU memory
5. Start chatting! 🎉

---

## App Architecture

```
NanoChat/
├── App.tsx                          # Root navigator (fade transitions)
├── src/
│   ├── constants/index.ts           # Models registry, color palette
│   ├── types/index.ts               # TypeScript interfaces
│   ├── hooks/
│   │   ├── useLLM.ts                # ⭐ Core LiteRT-LM bridge
│   │   └── useModelDownload.ts      # Download with resume support
│   ├── components/
│   │   ├── Header.tsx               # Animated header with status dot
│   │   ├── MessageBubble.tsx        # Chat bubbles with streaming cursor
│   │   └── DownloadProgressBar.tsx  # Animated progress + shimmer
│   └── screens/
│       ├── OnboardingScreen.tsx     # First-run, model selection
│       ├── DownloadScreen.tsx       # Download progress & pause/resume
│       ├── ChatScreen.tsx           # Main chat UI
│       └── SettingsScreen.tsx       # Model management
```

---

## Inference Stack

```
React Native (TypeScript)
        │
        │  Nitro Modules (JSI — zero-copy, no JSON bridge)
        ▼
react-native-litert-lm (C FFI, serial background queue)
        │
        │  Swift API
        ▼
LiteRT-LM Runtime
        │
        │  Metal / Neural Engine
        ▼
iPhone GPU / ANE (A14 Bionic+)
```

---

## Adding Your Own Models

To add more models, edit `src/constants/index.ts`:

```typescript
{
  id: 'my-model-id',
  name: 'My Model',
  variant: 'INT4 · Custom',
  description: 'Description...',
  sizeGB: 2.1,
  sizeMB: 2150,
  url: 'https://huggingface.co/.../model.litertlm',
  filename: 'my-model.litertlm',
  minRamGB: 4,
  recommended: false,
  color: '#059669',
}
```

Models must be in `.litertlm` format. Convert with the [LiteRT-LM conversion tools](https://github.com/google-ai-edge/LiteRT-LM).

---

## Performance Reference

| Device | Model | Backend | Speed |
|--------|-------|---------|-------|
| iPhone 16 Pro | Gemma 4 2B INT4 | GPU+ANE | ~40 tok/s |
| iPhone 15 | Gemma 4 2B INT4 | GPU | ~25 tok/s |
| iPhone 13 | Gemma 4 2B INT4 | GPU | ~14 tok/s |
| iPhone 12 | Gemma 4 2B INT4 | GPU | ~8 tok/s |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Module not found: react-native-litert-lm` | Run `npx expo prebuild` then `pod install` |
| `Failed to create engine` | Ensure you're on a **physical device**, not simulator |
| App crashes on model load | Check available RAM; close background apps |
| Download fails/stalls | Tap Pause → Resume (download is resumable) |
| Slow generation | Check that Metal backend is active (not CPU fallback) |
