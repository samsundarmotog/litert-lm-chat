const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

/**
 * Expo config plugin that patches ios/Podfile to disable Folly coroutines.
 *
 * React Native 0.86's prebuilt ReactNativeDependencies XCFramework doesn't
 * ship folly/coro/Coroutine.h, but react-native-reanimated's Worklets C++
 * code triggers the include when FOLLY_HAS_COROUTINES=1. This plugin
 * force-disables it across all pods to prevent the missing header build error.
 */
const withFollyCoroutinesFix = (config) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfile = fs.readFileSync(podfilePath, "utf8");

      const fix = `
    # Fix: RN 0.86 prebuilt ReactNativeDependencies doesn't ship folly/coro/Coroutine.h
    # Reanimated's Worklets C++ code triggers the include when FOLLY_HAS_COROUTINES=1.
    # Force-disable it across all pods to prevent the missing header build error.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1'
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
      end
    end`;

      // Only inject once
      if (!podfile.includes("FOLLY_HAS_COROUTINES=0")) {
        // Insert before the closing `end` of the post_install block
        podfile = podfile.replace(
          /(\s+react_native_post_install\([\s\S]*?\)\s*\n)(\s+end\s*\nend)/,
          `$1${fix}\n$2`
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);

module.exports = withFollyCoroutinesFix;
