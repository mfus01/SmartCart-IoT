package com.smartcart.database;

import java.sql.Connection;
import java.sql.DatabaseMetaData;

import org.springframework.boot.CommandLineRunner;



public class DatabaseConnectionTestRunner implements CommandLineRunner {

    private final DatabaseConnection databaseConnection;

    public DatabaseConnectionTestRunner(
            DatabaseConnection databaseConnection) {

        this.databaseConnection = databaseConnection;
    }

    @Override
    public void run(String... args) {

        System.out.println("======================================");
        System.out.println("KIEM TRA KET NOI SQLITE");
        System.out.println("Database path:");
        System.out.println(databaseConnection.getDatabasePath());

        try (Connection connection =
                     databaseConnection.getConnection()) {

            DatabaseMetaData metaData =
                    connection.getMetaData();

            System.out.println("Ket noi database THANH CONG!");
            System.out.println(
                    "Database: " + metaData.getDatabaseProductName()
            );

            System.out.println(
                    "Driver: " + metaData.getDriverName()
            );

        } catch (Exception e) {

            System.out.println("Ket noi database THAT BAI!");

            e.printStackTrace();
        }

        System.out.println("======================================");
    }
}