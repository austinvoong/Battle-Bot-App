import machine
import network
import json
from machine import Pin, PWM
import asyncio
import asyncio_ws

# WiFi Configuration
WIFI_SSID = "SpectrumSetup-CA93"
WIFI_PASSWORD = "silverpiano110"

# Pin Definitions for Motors (Using same GPIO pins as Arduino version)
MOTOR_LEFT_FWD = 14    # GPIO14 - Left drive motor forward
MOTOR_LEFT_BWD = 27    # GPIO27 - Left drive motor backward
MOTOR_LEFT_EN = 12     # GPIO12 - Left drive motor enable

MOTOR_RIGHT_FWD = 26   # GPIO26 - Right drive motor forward
MOTOR_RIGHT_BWD = 25   # GPIO25 - Right drive motor backward
MOTOR_RIGHT_EN = 13    # GPIO13 - Right drive motor enable

WEAPON_FWD = 33        # GPIO33 - Weapon motor forward
WEAPON_BWD = 32        # GPIO32 - Weapon motor backward
WEAPON_EN = 15         # GPIO15 - Weapon motor enable

STATUS_LED = 2         # Built-in LED

# PWM Configuration
PWM_FREQ = 5000      # 5KHz frequency
PWM_MAX = 1023       # 10-bit resolution (0-1023) for MicroPython PWM

class BattleBot:
    def __init__(self):
        # Initialize control states
        self.safety_enabled = True
        self.power_enabled = True
        self.current_weapon_speed = 0
        self.last_command_time = 0
        
        # Setup pins and PWM
        self.setup_motors()
        self.setup_led()
        
        # Initialize WebSocket clients set
        self.clients = set()
        
    def setup_motors(self):
        """Initialize motor control pins with PWM and enable pins"""
        # Create PWM objects for each motor control pin
        self.left_fwd = PWM(Pin(MOTOR_LEFT_FWD))
        self.left_bwd = PWM(Pin(MOTOR_LEFT_BWD))
        self.left_en = PWM(Pin(MOTOR_LEFT_EN))
        
        self.right_fwd = PWM(Pin(MOTOR_RIGHT_FWD))
        self.right_bwd = PWM(Pin(MOTOR_RIGHT_BWD))
        self.right_en = PWM(Pin(MOTOR_RIGHT_EN))
        
        self.weapon_fwd = PWM(Pin(WEAPON_FWD))
        self.weapon_bwd = PWM(Pin(WEAPON_BWD))
        self.weapon_en = PWM(Pin(WEAPON_EN))
        
        # Set PWM frequency for all motors
        for pwm in [self.left_fwd, self.left_bwd, self.right_fwd, 
                   self.right_bwd, self.weapon_fwd, self.weapon_bwd,
                   self.left_en, self.right_en, self.weapon_en]:
            pwm.freq(PWM_FREQ)
            pwm.duty(0)  # Start with motors stopped
            
        # Set enable pins to maximum when powered and not in safety mode
        self.update_enable_pins()
            
    def setup_led(self):
        """Initialize status LED"""
        self.status_led = Pin(STATUS_LED, Pin.OUT)
        self.status_led.off()
        
    def update_enable_pins(self):
        """Update enable pins based on power and safety state"""
        enable_value = PWM_MAX if (self.power_enabled and not self.safety_enabled) else 0
        self.left_en.duty(enable_value)
        self.right_en.duty(enable_value)
        self.weapon_en.duty(enable_value)

    def set_motors(self, left_speed, right_speed):
        """Set drive motor speeds with safety checks
        
        Args:
            left_speed (int): Speed for left motor (-1023 to 1023)
            right_speed (int): Speed for right motor (-1023 to 1023)
        """
        if not self.power_enabled or self.safety_enabled:
            self.stop_drive_motors()
            self.update_enable_pins()
            return
            
        # Constrain speeds to valid PWM range
        left_speed = max(min(left_speed, PWM_MAX), -PWM_MAX)
        right_speed = max(min(right_speed, PWM_MAX), -PWM_MAX)
        
        # Set left motor
        if left_speed >= 0:
            self.left_fwd.duty(left_speed)
            self.left_bwd.duty(0)
        else:
            self.left_fwd.duty(0)
            self.left_bwd.duty(-left_speed)
            
        # Set right motor
        if right_speed >= 0:
            self.right_fwd.duty(right_speed)
            self.right_bwd.duty(0)
        else:
            self.right_fwd.duty(0)
            self.right_bwd.duty(-right_speed)
            
    def set_weapon(self, speed):
        """Set weapon motor speed with safety checks
        
        Args:
            speed (int): Weapon motor speed (-1023 to 1023)
        """
        if not self.power_enabled or self.safety_enabled:
            self.stop_weapon()
            return
            
        speed = max(min(speed, PWM_MAX), -PWM_MAX)
        self.current_weapon_speed = speed
        
        if speed >= 0:
            self.weapon_fwd.duty(speed)
            self.weapon_bwd.duty(0)
        else:
            self.weapon_fwd.duty(0)
            self.weapon_bwd.duty(-speed)
            
    def stop_drive_motors(self):
        """Stop all drive motors"""
        for pwm in [self.left_fwd, self.left_bwd, 
                   self.right_fwd, self.right_bwd]:
            pwm.duty(0)
            
    def stop_weapon(self):
        """Stop weapon motor"""
        self.weapon_fwd.duty(0)
        self.weapon_bwd.duty(0)
        self.current_weapon_speed = 0
        
    def stop_all(self):
        """Stop all motors"""
        self.stop_drive_motors()
        self.stop_weapon()
        
    def get_status(self):
        """Generate status message for clients"""
        return json.dumps({
            "type": "status",
            "safety": self.safety_enabled,
            "power": self.power_enabled,
            "weaponSpeed": self.current_weapon_speed
        })

async def handle_websocket(websocket, bot):
    """Handle WebSocket connections and messages"""
    try:
        bot.clients.add(websocket)
        bot.status_led.on()
        await websocket.send(bot.get_status())
        
        async for message in websocket:
            try:
                data = json.loads(message)
                cmd_type = data.get("type")
                
                if cmd_type == "movement":
                    x = data.get("x", 0)
                    y = data.get("y", 0)
                    
                    # Convert x,y to motor speeds with mixing
                    left_speed = y + x
                    right_speed = y - x
                    
                    # Map joystick values (-100 to 100) to PWM range (-1023 to 1023)
                    left_speed = int((left_speed / 100) * PWM_MAX)
                    right_speed = int((right_speed / 100) * PWM_MAX)
                    
                    bot.set_motors(left_speed, right_speed)
                    
                elif cmd_type == "weapon":
                    if not bot.safety_enabled and bot.power_enabled:
                        speed = data.get("speed", 0)
                        # Map speed to PWM range
                        speed = int((speed / 100) * PWM_MAX)
                        bot.set_weapon(speed)
                        
                elif cmd_type == "safety":
                    bot.safety_enabled = data.get("enabled", True)
                    if bot.safety_enabled:
                        bot.stop_all()
                    await websocket.send(bot.get_status())
                    
                elif cmd_type == "power":
                    bot.power_enabled = data.get("enabled", True)
                    if not bot.power_enabled:
                        bot.stop_all()
                    await websocket.send(bot.get_status())
                    
                bot.last_command_time = time.ticks_ms()
                    
            except ValueError as e:
                print("Invalid JSON received:", e)
                
    except Exception as e:
        print("WebSocket error:", e)
    finally:
        bot.clients.remove(websocket)
        if not bot.clients:
            bot.status_led.off()
        bot.stop_all()

async def watchdog(bot):
    """Safety watchdog - stops motors if no commands received for 1 second"""
    while True:
        if time.ticks_diff(time.ticks_ms(), bot.last_command_time) > 1000:
            bot.stop_all()
        await asyncio.sleep_ms(100)

async def main():
    # Connect to WiFi
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    while not wlan.isconnected():
        print("Connecting to WiFi...")
        await asyncio.sleep(1)
    
    print("Connected to WiFi")
    print("IP Address:", wlan.ifconfig()[0])
    
    # Initialize battle bot
    bot = BattleBot()
    
    # Start WebSocket server
    server = await asyncio_ws.serve(
        lambda ws: handle_websocket(ws, bot),
        "0.0.0.0",
        81
    )
    
    # Start watchdog
    asyncio.create_task(watchdog(bot))
    
    # Run forever
    await asyncio.gather(server.wait_closed())

# Start the event loop
asyncio.run(main())