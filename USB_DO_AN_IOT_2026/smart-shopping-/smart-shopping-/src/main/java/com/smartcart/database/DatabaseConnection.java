package com.smartcart.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConnection {

    private final String databasePath;

    public DatabaseConnection(
            @Value("${app.database.path}") String databasePath) {

        this.databasePath = databasePath;
        System.out.println("========== DATABASE PATH ==========");
        System.out.println(databasePath);
        System.out.println("====================================");
    }

    public Connection getConnection() throws SQLException {

        String url = "jdbc:sqlite:" + databasePath;

        return DriverManager.getConnection(url);
    }

    public String getDatabasePath() {
        return databasePath;
    }
}