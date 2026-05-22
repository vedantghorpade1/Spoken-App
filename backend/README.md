# SpeakAI Backend

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the API for Expo Go / physical devices:

```bash
uvicorn main:app --reload --host 0.0.0.0
```

`localhost` and `127.0.0.1` only work from the same machine. A phone running Expo Go must connect to the computer's local IPv4 address, for example `http://192.168.1.6:8000`, while both devices are on the same WiFi network.

Agora voice matching uses these backend environment variables:

```env
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
AGORA_TOKEN_TTL_SECONDS=3600
```

`AGORA_APP_CERTIFICATE` must stay on the backend only. The mobile app should only expose `EXPO_PUBLIC_AGORA_APP_ID`.
