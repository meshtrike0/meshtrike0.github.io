/*
 * Site configuration. Change download links and version labels here only.
 *
 * MESHTRIKE_APK_URL  - the main Meshtrike app APK (no internet permission).
 * REACH_APK_URL      - the optional MeshGRID add-on APK
 *                      (Wi-Fi Direct + the private internet route over the Nym mixnet).
 *
 * While a URL still starts with "#", the button shows a "coming soon" note instead of downloading.
 */
window.MESHTRIKE_CONFIG = {
  MESHTRIKE_APK_URL: "#download",
  REACH_APK_URL: "#download-meshgrid",

  // Shown in the hero badge, the download section and the compare table.
  MESHTRIKE_VERSION: "v11",
  REACH_VERSION: "v1.2",

  // File names used in the "Downloading ..." confirmation.
  MESHTRIKE_APK_NAME: "meshtrike-v11.apk",
  REACH_APK_NAME: "meshgrid-v1.2.apk"
};
