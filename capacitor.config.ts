import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.livemap.emergency",
  appName: "LiveMap Emergency",
  webDir: "out",
  server: {
    // For development, use your local IP:
    // url: "http://192.168.1.X:3000",
    // cleartext: true,
  },
  plugins: {
    Geolocation: {
      // Request precise location
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#0f0f23",
  },
};

export default config;
