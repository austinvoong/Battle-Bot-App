import network
import socket
import time
from machine import Pin, PWM

# Define the motor pins (replace these with your actual motor pin connections)
motorA = PWM(Pin(12), freq=1000)
motorB = PWM(Pin(14), freq=1000)

# Function to connect to Wi-Fi
def connect_wifi(ssid, password):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)

    while not wlan.isconnected():
        print("Connecting to Wi-Fi...")
        time.sleep(1)
    
    print("Wi-Fi connected:", wlan.ifconfig())

# Function to handle motor control
def control_bot(command):
    if command == 'forward':
        motorA.duty(512)
        motorB.duty(512)
    elif command == 'backward':
        motorA.duty(0)
        motorB.duty(0)
    elif command == 'left':
        motorA.duty(512)
        motorB.duty(256)  # Slow down one motor for turning
    elif command == 'right':
        motorA.duty(256)
        motorB.duty(512)
    else:
        motorA.duty(0)
        motorB.duty(0)  # Stop if unknown command
    print(f"Executed command: {command}")

# Function to set up an HTTP server
def start_server():
    addr = socket.getaddrinfo('0.0.0.0', 8080)[0][-1]
    s = socket.socket()
    s.bind(addr)
    s.listen(1)
    print("Listening on", addr)

    while True:
        cl, addr = s.accept()
        print("Client connected from", addr)
        cl_file = cl.makefile('rwb', 0)
        request = cl_file.readline().decode()

        # Extract the command from the HTTP request (simple example for GET requests)
        if "GET /" in request:
            command = request.split(' ')[1][1:]  # Get the command from the URL
            print(f"Received command: {command}")
            control_bot(command)

        # Respond with a basic HTTP response
        response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n" \
                   "<h1>ESP32 Battle Bot Controller</h1>"
        cl.send(response.encode())
        cl.close()

# Main entry point for the ESP32
def main():
    # Connect to Wi-Fi
    connect_wifi('your-ssid', 'your-password')

    # Start the HTTP server
    start_server()

# Run the main function
if __name__ == '__main__':
    main()
