1. Structure of communication:

Frontend → Backend: Control commands (movement, weapon, safety, power)
Backend → ESP32: Forwards control commands
ESP32 → Backend: Status updates
Backend → Frontend: Bot status and connection state


2. Build and deployment:

Set up your environment variables (REACT_APP_WS_URL)
Build your frontend (npm run build)
Deploy your backend server
Flash the ESP32 with the updated MicroPython code
