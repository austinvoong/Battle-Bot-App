// src/main.cpp
#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// Pin Definitions
const int MOTOR_LEFT_FWD = 25;
const int MOTOR_LEFT_BWD = 26;
const int MOTOR_RIGHT_FWD = 27;
const int MOTOR_RIGHT_BWD = 14;
const int WEAPON_PIN = 12;

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Control variables
bool safetyEnabled = true;
bool powerEnabled = true;

// WebSocket server
WebSocketsServer webSocket = WebSocketsServer(81);

// Motor control functions
void setMotors(int leftSpeed, int rightSpeed) {
  if (!powerEnabled || safetyEnabled) {
    analogWrite(MOTOR_LEFT_FWD, 0);
    analogWrite(MOTOR_LEFT_BWD, 0);
    analogWrite(MOTOR_RIGHT_FWD, 0);
    analogWrite(MOTOR_RIGHT_BWD, 0);
    return;
  }

  // Left motor
  if (leftSpeed >= 0) {
    analogWrite(MOTOR_LEFT_FWD, leftSpeed);
    analogWrite(MOTOR_LEFT_BWD, 0);
  } else {
    analogWrite(MOTOR_LEFT_FWD, 0);
    analogWrite(MOTOR_LEFT_BWD, -leftSpeed);
  }

  // Right motor
  if (rightSpeed >= 0) {
    analogWrite(MOTOR_RIGHT_FWD, rightSpeed);
    analogWrite(MOTOR_RIGHT_BWD, 0);
  } else {
    analogWrite(MOTOR_RIGHT_FWD, 0);
    analogWrite(MOTOR_RIGHT_BWD, -rightSpeed);
  }
}

void stopAll() {
  analogWrite(MOTOR_LEFT_FWD, 0);
  analogWrite(MOTOR_LEFT_BWD, 0);
  analogWrite(MOTOR_RIGHT_FWD, 0);
  analogWrite(MOTOR_RIGHT_BWD, 0);
  digitalWrite(WEAPON_PIN, LOW);
}

// WebSocket event handler
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      stopAll();
      break;
      
    case WStype_CONNECTED:
      Serial.printf("[%u] Connected!\n", num);
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
          
          // Convert x,y to motor speeds
          int leftSpeed = y + x;
          int rightSpeed = y - x;
          
          // Map to PWM range (0-255)
          leftSpeed = map(leftSpeed, -100, 100, -255, 255);
          rightSpeed = map(rightSpeed, -100, 100, -255, 255);
          
          setMotors(leftSpeed, rightSpeed);
        }
        else if (strcmp(cmdType, "weapon") == 0) {
          if (!safetyEnabled && powerEnabled) {
            bool active = doc["active"];
            digitalWrite(WEAPON_PIN, active ? HIGH : LOW);
          }
        }
        else if (strcmp(cmdType, "safety") == 0) {
          safetyEnabled = doc["enabled"];
          if (safetyEnabled) {
            stopAll();
          }
        }
        else if (strcmp(cmdType, "power") == 0) {
          powerEnabled = doc["enabled"];
          if (!powerEnabled) {
            stopAll();
          }
        }
      }
      break;
  }
}

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  
  // Configure pins
  pinMode(MOTOR_LEFT_FWD, OUTPUT);
  pinMode(MOTOR_LEFT_BWD, OUTPUT);
  pinMode(MOTOR_RIGHT_FWD, OUTPUT);
  pinMode(MOTOR_RIGHT_BWD, OUTPUT);
  pinMode(WEAPON_PIN, OUTPUT);
  
  // Initial state - all stopped
  stopAll();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
}