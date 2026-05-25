// Physical devices cannot reach your computer with localhost or 127.0.0.1.
// In Expo Go, localhost points to the phone itself, so use the backend machine's
// local IPv4 address while both devices are on the same WiFi network.
export const LOCAL_API_BASE_URL = 'http://192.168.1.6:8000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API_BASE_URL;
