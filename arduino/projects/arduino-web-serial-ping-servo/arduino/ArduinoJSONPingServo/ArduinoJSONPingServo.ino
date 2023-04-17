#include <NewPing.h>
#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

#include <Servo.h>

#define SERVO_PIN 3

#define TRIGGER_PIN  15  // Arduino pin tied to trigger pin on the ultrasonic sensor.
#define ECHO_PIN     14  // Arduino pin tied to echo pin on the ultrasonic sensor.
#define MAX_DISTANCE 200 // Maximum distance we want to ping for (in centimeters). Maximum sensor distance is rated at 400-500cm.

#define RELAY_PIN 16

Servo myservo;
NewPing sonar(TRIGGER_PIN, ECHO_PIN, MAX_DISTANCE); // NewPing setup of pins and maximum distance.

int servoAngle = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial) continue;
  myservo.attach(SERVO_PIN);
  myservo.write(servoAngle);
  pinMode(RELAY_PIN, OUTPUT);
}

void loop() {
  delay(50);                          // Wait 50ms between pings (about 20 pings/sec). 29ms should be the shortest delay between pings.
  {
    // send distance
    int distance = sonar.ping_cm();
    DynamicJsonDocument doc(256);

    doc["sensor"] = "distance";
    doc["value"] = distance;
    serializeJson(doc, Serial);
    Serial.println();
  }

  if (Serial.available() > 0) {
    String s = Serial.readStringUntil('\n');
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, s);
    if (error) {
      logSerial("json parse failed");
      return;
    }
    if (doc["type"] == "servo") {
      int angle = doc["value"];
      moveServo(angle);
    }
  }
}

void moveServo(int targetAngle) {
  int direction = (targetAngle > servoAngle) ? 1 : -1;
  while(targetAngle != servoAngle) {
    servoAngle += direction;
    myservo.write(servoAngle);
    delay(1);
  }
}

void logSerial(const char* message) {
  DynamicJsonDocument doc(256);
  doc["type"] = "message";
  doc["value"] = message;
  serializeJson(doc, Serial);
  Serial.println();
}