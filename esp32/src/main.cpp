#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Pin Definitions for Motors
const int MOTOR_LEFT_FWD = 14;    // GPIO14 - Left drive motor forward
const int MOTOR_LEFT_BWD = 27;    // GPIO27 - Left drive motor backward
const int MOTOR_RIGHT_FWD = 26;   // GPIO26 - Right drive motor forward
const int MOTOR_RIGHT_BWD = 25;   // GPIO25 - Right drive motor backward
const int WEAPON_FWD = 33;        // GPIO33 - Weapon motor forward
const int WEAPON_BWD = 32;        // GPIO32 - Weapon motor backward
const int STATUS_LED = 2;         // Built-in LED

// PWM Configuration
const int PWM_FREQUENCY = 5000;   // 5KHz
const int PWM_RESOLUTION = 8;     // 8-bit (0-255)
const int PWM_MAX = 255;         // Maximum PWM value

// PWM Channels
const int PWM_CHANNEL_LEFT_FWD = 0;
const int PWM_CHANNEL_LEFT_BWD = 1;
const int PWM_CHANNEL_RIGHT_FWD = 2;
const int PWM_CHANNEL_RIGHT_BWD = 3;
const int PWM_CHANNEL_WEAPON_FWD = 4;
const int PWM_CHANNEL_WEAPON_BWD = 5;

// Control variables
bool safetyEnabled = true;
bool powerEnabled = true;
int currentWeaponSpeed = 0;

// WebSocket server
WebSocketsServer webSocket = WebSocketsServer(81);

// Function declarations
void setupMotors();
void setMotors(int leftSpeed, int rightSpeed);
void setWeaponSpeed(int speed);
void stopAll();
void handleWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);

// Motor setup function
void setupMotors() {
    // Configure PWM for each channel
    for(int i = 0; i < 6; i++) {
        ledcSetup(i, PWM_FREQUENCY, PWM_RESOLUTION);
    }
    
    // Attach PWM channels to GPIO pins
    ledcAttachPin(MOTOR_LEFT_FWD, PWM_CHANNEL_LEFT_FWD);
    ledcAttachPin(MOTOR_LEFT_BWD, PWM_CHANNEL_LEFT_BWD);
    ledcAttachPin(MOTOR_RIGHT_FWD, PWM_CHANNEL_RIGHT_FWD);
    ledcAttachPin(MOTOR_RIGHT_BWD, PWM_CHANNEL_RIGHT_BWD);
    ledcAttachPin(WEAPON_FWD, PWM_CHANNEL_WEAPON_FWD);
    ledcAttachPin(WEAPON_BWD, PWM_CHANNEL_WEAPON_BWD);
    
    // Configure status LED
    pinMode(STATUS_LED, OUTPUT);
    digitalWrite(STATUS_LED, LOW);
}

// Set drive motor speeds
void setMotors(int leftSpeed, int rightSpeed) {
    if (!powerEnabled || safetyEnabled) {
        ledcWrite(PWM_CHANNEL_LEFT_FWD, 0);
        ledcWrite(PWM_CHANNEL_LEFT_BWD, 0);
        ledcWrite(PWM_CHANNEL_RIGHT_FWD, 0);
        ledcWrite(PWM_CHANNEL_RIGHT_BWD, 0);
        return;
    }

    // Constrain speeds to valid PWM range
    leftSpeed = constrain(leftSpeed, -PWM_MAX, PWM_MAX);
    rightSpeed = constrain(rightSpeed, -PWM_MAX, PWM_MAX);

    // Set left motor
    if (leftSpeed >= 0) {
        ledcWrite(PWM_CHANNEL_LEFT_FWD, leftSpeed);
        ledcWrite(PWM_CHANNEL_LEFT_BWD, 0);
    } else {
        ledcWrite(PWM_CHANNEL_LEFT_FWD, 0);
        ledcWrite(PWM_CHANNEL_LEFT_BWD, -leftSpeed);
    }

    // Set right motor
    if (rightSpeed >= 0) {
        ledcWrite(PWM_CHANNEL_RIGHT_FWD, rightSpeed);
        ledcWrite(PWM_CHANNEL_RIGHT_BWD, 0);
    } else {
        ledcWrite(PWM_CHANNEL_RIGHT_FWD, 0);
        ledcWrite(PWM_CHANNEL_RIGHT_BWD, -rightSpeed);
    }
}

// Set weapon motor speed
void setWeaponSpeed(int speed) {
    if (!powerEnabled || safetyEnabled) {
        ledcWrite(PWM_CHANNEL_WEAPON_FWD, 0);
        ledcWrite(PWM_CHANNEL_WEAPON_BWD, 0);
        currentWeaponSpeed = 0;
        return;
    }

    speed = constrain(speed, -PWM_MAX, PWM_MAX);
    currentWeaponSpeed = speed;

    if (speed >= 0) {
        ledcWrite(PWM_CHANNEL_WEAPON_FWD, speed);
        ledcWrite(PWM_CHANNEL_WEAPON_BWD, 0);
    } else {
        ledcWrite(PWM_CHANNEL_WEAPON_FWD, 0);
        ledcWrite(PWM_CHANNEL_WEAPON_BWD, -speed);
    }
}

// Stop all motors
void stopAll() {
    ledcWrite(PWM_CHANNEL_LEFT_FWD, 0);
    ledcWrite(PWM_CHANNEL_LEFT_BWD, 0);
    ledcWrite(PWM_CHANNEL_RIGHT_FWD, 0);
    ledcWrite(PWM_CHANNEL_RIGHT_BWD, 0);
    ledcWrite(PWM_CHANNEL_WEAPON_FWD, 0);
    ledcWrite(PWM_CHANNEL_WEAPON_BWD, 0);
    currentWeaponSpeed = 0;
}

// Send status update to clients
void sendStatus(uint8_t num) {
    DynamicJsonDocument doc(200);
    doc["type"] = "status";
    doc["safety"] = safetyEnabled;
    doc["power"] = powerEnabled;
    doc["weaponSpeed"] = currentWeaponSpeed;
    
    String status;
    serializeJson(doc, status);
    webSocket.sendTXT(num, status);
}

// WebSocket event handler
void handleWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] Disconnected!\n", num);
            digitalWrite(STATUS_LED, LOW);
            stopAll();
            break;
            
        case WStype_CONNECTED:
            {
                Serial.printf("[%u] Connected!\n", num);
                digitalWrite(STATUS_LED, HIGH);
                sendStatus(num);
            }
            break;
            
        case WStype_TEXT:
            {
                StaticJsonDocument<200> doc;
                DeserializationError error = deserializeJson(doc, payload);
                
                if (error) {
                    Serial.println("JSON parsing failed!");
                    return;
                }

                const char* cmdType = doc["type"];
                
                if (strcmp(cmdType, "movement") == 0) {
                    int x = doc["x"];
                    int y = doc["y"];
                    
                    // Convert x,y to motor speeds with mixing
                    int leftSpeed = y + x;
                    int rightSpeed = y - x;
                    
                    // Map joystick values (-100 to 100) to PWM range (-255 to 255)
                    leftSpeed = map(leftSpeed, -100, 100, -PWM_MAX, PWM_MAX);
                    rightSpeed = map(rightSpeed, -100, 100, -PWM_MAX, PWM_MAX);
                    
                    setMotors(leftSpeed, rightSpeed);
                }
                else if (strcmp(cmdType, "weapon") == 0) {
                    if (!safetyEnabled && powerEnabled) {
                        int speed = doc["speed"] | 0;  // Default to 0 if not specified
                        setWeaponSpeed(speed);
                    }
                }
                else if (strcmp(cmdType, "safety") == 0) {
                    safetyEnabled = doc["enabled"];
                    if (safetyEnabled) {
                        stopAll();
                    }
                    sendStatus(num);
                }
                else if (strcmp(cmdType, "power") == 0) {
                    powerEnabled = doc["enabled"];
                    if (!powerEnabled) {
                        stopAll();
                    }
                    sendStatus(num);
                }
            }
            break;
    }
}

void setup() {
    // Initialize serial communication
    Serial.begin(115200);
    
    // Setup motors and LED
    setupMotors();
    stopAll();
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));  // Blink while connecting
    }
    
    Serial.println("\nConnected to WiFi");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    // Start WebSocket server
    webSocket.begin();
    webSocket.onEvent(handleWebSocketEvent);
    digitalWrite(STATUS_LED, HIGH);  // Solid LED when ready
}

void loop() {
    webSocket.loop();
    
    // Optional: Add watchdog for safety
    static unsigned long lastCommand = 0;
    if (millis() - lastCommand > 1000) {  // Stop if no commands received for 1 second
        stopAll();
    }
}