// ============================================================================
// SMART SHOPPING CART - RFID RC522 + WIFI (optimized for 52 passive RFID tags)
// ESP32 / Arduino IDE / MFRC522 library
// - NO AS5600, NO I2C
// - RC522 RST = GPIO22
// - RFID polling on Arduino loop (fast, no HTTP blocking)
// - HTTP POST on a separate FreeRTOS task, with bounded FIFO queue
// - Keeps Spring Boot: POST /api/rfid/scan {"uid":"..."}
// - Keeps ESP32 APIs: GET /status, GET /rfid, GET /reset
// ============================================================================

#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <HTTPClient.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>
#include <string.h>

// 1. FILL YOUR OWN WI-FI DETAILS (never share your Wi-Fi password publicly).
const char* WIFI_SSID = "Shophouse T12-21";
const char* WIFI_PASSWORD = "101012dh";

// Set this to the CURRENT laptop IPv4 address running Spring Boot.
const char* BACKEND_URL = "http://192.168.1.53:8080/api/rfid/scan";
const bool ENABLE_BACKEND_PUSH = true;

// 2. RC522 WIRING - MFRC522 is powered from 3.3V, NEVER from 5V.
#define RFID_SS_PIN   5
#define RFID_RST_PIN  22
#define RFID_SCK_PIN  18
#define RFID_MISO_PIN 19
#define RFID_MOSI_PIN 23

// 3. TUNING
const unsigned long DUPLICATE_UID_COOLDOWN_MS = 900;
const unsigned long PRINT_INTERVAL_MS = 5000;
const unsigned long MAX_QUEUE_AGE_MS = 3000;
const uint8_t HTTP_QUEUE_CAPACITY = 24;
const uint8_t SEEN_CACHE_CAPACITY = 32;

struct RFIDEvent {
  char uid[21];  // ISO14443-A UID up to 10 bytes => 20 hex characters + NUL
  unsigned long scannedAt;
};

struct SeenRecord {
  char uid[21];
  unsigned long lastSeen;
};

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
WebServer server(80);
QueueHandle_t httpQueue = nullptr;
TaskHandle_t httpTaskHandle = nullptr;

SeenRecord seenCache[SEEN_CACHE_CAPACITY] = {};
uint8_t seenInsertIndex = 0;

bool rfidReaderOk = false;
bool serverStarted = false;
bool wifiWasConnected = false;
String lastRFIDUID = "";        // used only by Arduino loop / WebServer
uint32_t totalRFIDScans = 0;   // count unique reads accepted after cooldown
uint32_t queueDropCount = 0;   // count of new UIDs not enqueued (full queue)
unsigned long lastPrint = 0;

// Read from loop, written from HTTP task. Protected by spinlock.
portMUX_TYPE statsMux = portMUX_INITIALIZER_UNLOCKED;
int lastBackendHttpCode = 0;
uint32_t postedOKCount = 0;
uint32_t postedErrorCount = 0;
uint32_t expiredCount = 0;

void makeUID(char out[21]) {
  static const char HEX_DIGITS[] = "0123456789ABCDEF";

  const uint8_t n = (rfid.uid.size > 10)
                      ? 10
                      : rfid.uid.size;

  for (uint8_t i = 0; i < n; ++i) {
    out[i * 2] = HEX_DIGITS[rfid.uid.uidByte[i] >> 4];

    out[i * 2 + 1] =
        HEX_DIGITS[rfid.uid.uidByte[i] & 0x0F];
  }

  out[n * 2] = '\0';
}

// Per-UID duplicate filter. Different consecutive tags are NOT blocked.
bool isDuplicateAndRemember(const char* uid, unsigned long now) {
  for (uint8_t i = 0; i < SEEN_CACHE_CAPACITY; ++i) {
    if (strcmp(seenCache[i].uid, uid) == 0) {
      if (now - seenCache[i].lastSeen < DUPLICATE_UID_COOLDOWN_MS) {
        return true;
      }
      seenCache[i].lastSeen = now;
      return false;
    }
  }
  strncpy(seenCache[seenInsertIndex].uid, uid, 20);
  seenCache[seenInsertIndex].uid[20] = '\0';
  seenCache[seenInsertIndex].lastSeen = now;
  seenInsertIndex = (seenInsertIndex + 1) % SEEN_CACHE_CAPACITY;
  return false;
}

void updateRFID() {
  if (!rfidReaderOk) return;
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  char uid[21] = {0};
  makeUID(uid);
  const unsigned long now = millis();

  if (!isDuplicateAndRemember(uid, now)) {
    lastRFIDUID = uid;
    ++totalRFIDScans;
    Serial.print("[RFID] UID: ");
    Serial.print(uid);
    Serial.print(" | Count: ");
    Serial.println(totalRFIDScans);

    if (ENABLE_BACKEND_PUSH && httpQueue != nullptr) {
      RFIDEvent event = {};
      strncpy(event.uid, uid, 20);
      event.scannedAt = now;
      if (xQueueSend(httpQueue, &event, 0) != pdTRUE) {
        ++queueDropCount;
        Serial.println("[RFID] WARNING: HTTP queue full; dropped this scan");
      }
    }
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// Separate task: network delays cannot block the RC522 reader loop.
void httpWorker(void* parameter) {
  RFIDEvent event = {};
  while (true) {
    if (xQueueReceive(httpQueue, &event, portMAX_DELAY) != pdTRUE) continue;

    // Avoid reporting an old location after a long Wi-Fi / backend outage.
    if (millis() - event.scannedAt > MAX_QUEUE_AGE_MS) {
      portENTER_CRITICAL(&statsMux);
      ++expiredCount;
      portEXIT_CRITICAL(&statsMux);
      continue;
    }

    if (WiFi.status() != WL_CONNECTED) {
      portENTER_CRITICAL(&statsMux);
      ++postedErrorCount;
      lastBackendHttpCode = -100;
      portEXIT_CRITICAL(&statsMux);
      Serial.print("[HTTP] No Wi-Fi, UID not sent: ");
      Serial.println(event.uid);
      continue;
    }

    WiFiClient client;
    HTTPClient http;
    int code = -1;
    if (http.begin(client, BACKEND_URL)) {
      http.setConnectTimeout(500);
      http.setTimeout(700);
      http.addHeader("Content-Type", "application/json");
      const String body = String("{\"uid\":\"") + event.uid + "\"}";
      code = http.POST(body);
      Serial.print("[HTTP] UID=");
      Serial.print(event.uid);
      Serial.print(" | Backend HTTP: ");
      Serial.println(code);
      if (code > 0 && code != 200) {
        Serial.println(http.getString());
      }
      http.end();
    } else {
      Serial.println("[HTTP] Unable to open backend URL");
    }

    portENTER_CRITICAL(&statsMux);
    lastBackendHttpCode = code;
    if (code == 200) ++postedOKCount;
    else ++postedErrorCount;
    portEXIT_CRITICAL(&statsMux);
  }
}

void getHttpStats(int& code, uint32_t& ok, uint32_t& errors, uint32_t& expired) {
  portENTER_CRITICAL(&statsMux);
  code = lastBackendHttpCode;
  ok = postedOKCount;
  errors = postedErrorCount;
  expired = expiredCount;
  portEXIT_CRITICAL(&statsMux);
}

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
}

void handleStatus() {
  int code;
  uint32_t ok, errors, expired;
  getHttpStats(code, ok, errors, expired);

  String json = "{";
  json += "\"device\":\"ESP32\",";
  json += "\"wifiConnected\":";
  json += (WiFi.status() == WL_CONNECTED ? "true," : "false,");
  json += "\"rfidReaderOk\":";
  json += (rfidReaderOk ? "true," : "false,");
  json += "\"lastRFIDUID\":\"" + lastRFIDUID + "\",";
  json += "\"totalRFIDScans\":" + String(totalRFIDScans) + ",";
  json += "\"queuedScans\":" + String(httpQueue ? uxQueueMessagesWaiting(httpQueue) : 0) + ",";
  json += "\"queueDropCount\":" + String(queueDropCount) + ",";
  json += "\"postedOKCount\":" + String(ok) + ",";
  json += "\"postedErrorCount\":" + String(errors) + ",";
  json += "\"expiredScanCount\":" + String(expired) + ",";
  json += "\"lastBackendHttpCode\":" + String(code) + ",";
  json += "\"uptimeMs\":" + String(millis());
  json += "}";
  addCors();
  server.send(200, "application/json", json);
}

void handleRFIDStatus() {
  String json = "{";
  json += "\"success\":true,";
  json += "\"uid\":\"" + lastRFIDUID + "\",";
  json += "\"readerOk\":";
  json += (rfidReaderOk ? "true," : "false,");
  json += "\"scanCount\":" + String(totalRFIDScans);
  json += "}";
  addCors();
  server.send(200, "application/json", json);
}

void handleReset() {
  lastRFIDUID = "";
  totalRFIDScans = 0;
  queueDropCount = 0;
  memset(seenCache, 0, sizeof(seenCache));
  seenInsertIndex = 0;
  portENTER_CRITICAL(&statsMux);
  lastBackendHttpCode = 0;
  postedOKCount = 0;
  postedErrorCount = 0;
  expiredCount = 0;
  portEXIT_CRITICAL(&statsMux);
  addCors();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"RFID statistics reset\"}");
}

void monitorWiFi() {
  const bool connected = WiFi.status() == WL_CONNECTED;
  if (connected && !wifiWasConnected) {
    Serial.print("[WIFI] Connected, ESP32 IP: ");
    Serial.println(WiFi.localIP());
    if (!serverStarted) {
      server.begin();
      serverStarted = true;
    }
  } else if (!connected && wifiWasConnected) {
    Serial.println("[WIFI] Disconnected; waiting for auto-reconnect...");
    if (serverStarted) {
      server.stop();
      serverStarted = false;
    }
  }
  wifiWasConnected = connected;
}

void setup() {
  Serial.begin(115200);
  delay(600);
  Serial.println("\n=== SMART CART RFID52 (RST=GPIO22, NO AS5600) ===");

  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
  rfid.PCD_Init();
  delay(60);
  const byte version = rfid.PCD_ReadRegister(MFRC522::VersionReg);
  rfidReaderOk = (version != 0x00 && version != 0xFF);
  Serial.print("[RFID] RC522 Version: 0x");
  Serial.println(version, HEX);
  Serial.println(rfidReaderOk ? "[RFID] Reader ready" : "[RFID] ERROR: Check wiring and 3.3V");

  httpQueue = xQueueCreate(HTTP_QUEUE_CAPACITY, sizeof(RFIDEvent));
  if (httpQueue == nullptr) {
    Serial.println("[ERROR] Cannot allocate HTTP queue");
  } else {
    BaseType_t created = xTaskCreatePinnedToCore(
      httpWorker, "RFID_HTTP", 6144, nullptr, 1, &httpTaskHandle, 0);
    if (created != pdPASS) {
      Serial.println("[ERROR] Cannot start HTTP task");
      vQueueDelete(httpQueue);
      httpQueue = nullptr;
    }
  }

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.println("[WIFI] Connecting...");

  server.on("/status", HTTP_GET, handleStatus);
  server.on("/rfid", HTTP_GET, handleRFIDStatus);
  server.on("/reset", HTTP_GET, handleReset);
}

void loop() {
  updateRFID();
  monitorWiFi();
  if (serverStarted && WiFi.status() == WL_CONNECTED) {
    server.handleClient();
  }

  const unsigned long now = millis();
  if (now - lastPrint >= PRINT_INTERVAL_MS) {
    lastPrint = now;
    int code;
    uint32_t ok, errors, expired;
    getHttpStats(code, ok, errors, expired);
    Serial.print("[SYSTEM] WiFi=");
    Serial.print(WiFi.status() == WL_CONNECTED ? "OK" : "OFF");
    Serial.print(" | RC522=");
    Serial.print(rfidReaderOk ? "OK" : "ERROR");
    Serial.print(" | Scans=");
    Serial.print(totalRFIDScans);
    Serial.print(" | HTTP200=");
    Serial.print(ok);
    Serial.print(" | Errors=");
    Serial.print(errors);
    Serial.print(" | Queue=");
    Serial.print(httpQueue ? uxQueueMessagesWaiting(httpQueue) : 0);
    Serial.print(" | Dropped=");
    Serial.print(queueDropCount);
    Serial.print(" | Expired=");
    Serial.println(expired);
  }
  delay(1);
}
