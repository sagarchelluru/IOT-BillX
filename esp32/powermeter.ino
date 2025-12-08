#include <WiFi.h>
#include <HTTPClient.h>

// ----------------------
// WiFi Credentials
// ----------------------
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ----------------------
// Backend API Endpoint
// ----------------------
String serverUrl = "http://YOUR_BACKEND_IP:5000/add-consumption";

// ----------------------
// User Wallet Address
// (Smart contract expects this address)
// ----------------------
String userAddress = "0xYOUR_USER_WALLET_ADDRESS";

// ----------------------
// Sensor Pins (Change accordingly)
// ----------------------
int currentSensorPin = 34; // Example analog pin
int voltageSensorPin = 35;

// ----------------------
// Variables for energy calculation
// ----------------------
float voltage = 0.0;
float current = 0.0;
float power = 0.0;
float units = 0.0;

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
}

void loop() {

  // ---------------------------
  // 1. Read Sensor Data
  // ---------------------------

  // Replace these with your actual sensor code

  int currentRaw = analogRead(currentSensorPin);
  int voltageRaw = analogRead(voltageSensorPin);

  // Example simple conversion 
  current = (currentRaw / 4095.0) * 30.0;   // Assuming max 30A sensor
  voltage = (voltageRaw / 4095.0) * 250.0; // Assuming 250V max

  power = voltage * current;  // Watts

  // Convert to energy consumption (Units = kWh)
  units = power / 1000.0;  // Convert W to kW  
  units = units * (1.0 / 3600.0);  // Per second loop

  Serial.println("------ Sensor Readings ------");
  Serial.print("Voltage: "); Serial.println(voltage);
  Serial.print("Current: "); Serial.println(current);
  Serial.print("Power: "); Serial.println(power);
  Serial.print("Units (kWh): "); Serial.println(units);


  // ---------------------------
  // 2. Send to Backend API
  // ---------------------------
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // JSON payload
    String payload = "{\"userAddress\":\"" + userAddress + "\", \"units\":" + String(units, 6) + "}";

    Serial.println("Sending payload:");
    Serial.println(payload);

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      Serial.print("Response Code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println("Server Response: " + response);
    } else {
      Serial.print("Error sending POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }

  delay(5000); // Send every 5 seconds (adjust as needed)
}
