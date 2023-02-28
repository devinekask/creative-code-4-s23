#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  while (!Serial) continue;
}

void loop() {
  // put your main code here, to run repeatedly:
  int xValue = analogRead(A0);
  int yValue = analogRead(A1);

  DynamicJsonDocument doc(1024);

  doc["sensor"] = "joystick";
  doc["data"][0] = xValue;
  doc["data"][1] = yValue;

  serializeJson(doc, Serial);
  Serial.println();
  delay(100);
}
