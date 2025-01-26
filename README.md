1. Structure of communication:

Frontend → Backend: Control commands (movement, weapon, safety, power)
Backend → ESP32: Forwards control commands
ESP32 → Backend: Status updates
Backend → Frontend: Bot status and connection state


2. Build and deployment:

Frontend Dependencies
npm install express ws cors http path

Backend Dependencies
npm install react react-dom
npm install ws
npm install @types/ws

Micropython Library
micropython-asyncio
micropython-websockets
