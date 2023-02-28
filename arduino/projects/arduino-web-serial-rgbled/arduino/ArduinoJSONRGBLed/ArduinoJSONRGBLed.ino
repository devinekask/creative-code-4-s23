#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

// pins for the LEDs:
const int redPin = 3;
const int greenPin = 5;
const int bluePin = 6;

void setup() {
// Initialize serial port
  Serial.begin(9600);
  while (!Serial) continue;
  // make the pins outputs:
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
}

void loop() {
  // if there's any serial available, read it:
  if (Serial.available() > 0) {
    String s = Serial.readStringUntil('\n');
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, s);
    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
      return;
    }
    int red = doc["r"];
    int green = doc["g"];
    int blue = doc["b"];

    red = constrain(red, 0, 255);
    green = constrain(green, 0, 255);
    blue = constrain(blue, 0, 255);

    // fade the red, green, and blue legs of the LED:
    analogWrite(redPin, red);
    analogWrite(greenPin, green);
    analogWrite(bluePin, blue);

    Serial.print("r: ");
    Serial.print(red);
    Serial.print(" ");
    Serial.print("g: ");
    Serial.print(green);
    Serial.print(" ");
    Serial.print("b: ");
    Serial.println(blue);
  }
}
