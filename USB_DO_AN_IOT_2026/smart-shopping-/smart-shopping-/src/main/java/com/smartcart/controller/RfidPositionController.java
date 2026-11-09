package com.smartcart.controller;

import java.nio.file.Files;
import java.nio.file.Path;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.util.Locale;
import java.util.Map;

import java.util.concurrent.atomic.AtomicReference;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rfid")
public class RfidPositionController {

    // ==========================================
    // 1. DATABASE
    // ==========================================

    private final String databasePath;

    public RfidPositionController(
            @Value("${smartcart.sqlite.path}")
            String databasePath) {

        this.databasePath = databasePath;
    }

    // ==========================================
    // 2. VI TRI XE
    // ==========================================

    public record Position(
        double x,
        double y,
        String location
    ) {}

    public record ScanRequest(
        String uid
    ) {}

    // Vi tri ban dau tai cua vao

    private final AtomicReference<Position>
        currentPosition = new AtomicReference<>(
            new Position(17, 111, "CUA_VAO")
        );

    // ==========================================
    // 3. TIM VI TRI THE TRONG SQLITE
    // ==========================================

    private Position findRFIDPosition(String uid)
            throws Exception {

        Path file = Path.of(databasePath)
                .toAbsolutePath();

        if (!Files.isRegularFile(file)) {

            throw new IllegalStateException(
                "Khong tim thay database: " + file
            );
        }

        String sql = """
            SELECT
                location_name,
                x_coord,
                y_coord

            FROM rfid_locations

            WHERE uid = ?
            """;

        try (
            Connection conn =
                DriverManager.getConnection(
                    "jdbc:sqlite:" + file
                );

            PreparedStatement stmt =
                conn.prepareStatement(sql)
        ) {

            stmt.setString(1, uid);

            try (
                ResultSet rs = stmt.executeQuery()
            ) {

                if (rs.next()) {

                    return new Position(
                        rs.getDouble("x_coord"),
                        rs.getDouble("y_coord"),
                        rs.getString("location_name")
                    );
                }
            }
        }

        return null;
    }

    // ==========================================
    // 4. ESP32 GUI UID
    // ==========================================

    @PostMapping("/scan")
    public ResponseEntity<?> scan(
            @RequestBody ScanRequest request) {

        if (request == null ||
                request.uid() == null) {

            return ResponseEntity.badRequest().body(
                Map.of(
                    "success", false,
                    "message", "Thieu UID"
                )
            );
        }

        String uid = request.uid()
            .trim()
            .replaceAll("[\\s:-]", "")
            .toUpperCase(Locale.ROOT);

        if (!uid.matches("[0-9A-F]{8,20}")) {

            return ResponseEntity.badRequest().body(
                Map.of(
                    "success", false,
                    "message", "UID khong hop le"
                )
            );
        }

        try {

            Position position =
                findRFIDPosition(uid);

            if (position == null) {

                System.out.println(
                    "[RFID] The chua dang ky: " + uid
                );

                return ResponseEntity.status(404).body(
                    Map.of(
                        "success", false,
                        "uid", uid,
                        "message",
                        "The RFID chua duoc dang ky"
                    )
                );
            }

            // Cap nhat vi tri xe

            currentPosition.set(position);

            System.out.println(
                "[RFID] UID: " + uid
            );

            System.out.println(
                "[RFID] Vi tri: " +
                position.location()
            );

            System.out.println(
                "[RFID] X: " +
                position.x()
            );

            System.out.println(
                "[RFID] Y: " +
                position.y()
            );

            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "uid", uid,
                    "x", position.x(),
                    "y", position.y(),
                    "location", position.location()
                )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                .internalServerError()
                .body(
                    Map.of(
                        "success", false,
                        "message",
                        "Loi truy van database RFID"
                    )
                );
        }
    }

    // ==========================================
    // 5. WEBSITE LAY VI TRI XE
    // ==========================================

    @GetMapping("/position")
    public Position getPosition() {

        return currentPosition.get();
    }
}