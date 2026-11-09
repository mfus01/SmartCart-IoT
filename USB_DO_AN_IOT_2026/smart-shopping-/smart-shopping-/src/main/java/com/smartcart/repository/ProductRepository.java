package com.smartcart.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.text.Normalizer;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Repository;

import com.smartcart.database.DatabaseConnection;
import com.smartcart.model.Product;

@Repository
public class ProductRepository {

    private final DatabaseConnection databaseConnection;

    public ProductRepository(DatabaseConnection databaseConnection) {
        this.databaseConnection = databaseConnection;
    }

    // =========================================================
    // 1. LAY TOAN BO DANH SACH SAN PHAM
    // =========================================================
    public List<Product> findAll() {

        List<Product> products = new ArrayList<>();

        String sql = """
                SELECT id,
                       name,
                       category,
                       price,
                       shelf_id,
                       x_coord,
                       y_coord,
                       qr_code
                FROM Products
                ORDER BY id
                """;

        try (
            Connection connection = databaseConnection.getConnection();
        		
            PreparedStatement statement = connection.prepareStatement(sql);
            ResultSet resultSet = statement.executeQuery()
        ) {

            while (resultSet.next()) {

                Product product = new Product(
                        resultSet.getString("id"),
                        resultSet.getString("name"),
                        resultSet.getString("category"),
                        resultSet.getInt("price"),
                        resultSet.getString("shelf_id"),
                        resultSet.getInt("x_coord"),
                        resultSet.getInt("y_coord"),
                        resultSet.getString("qr_code")
                );

                products.add(product);
            }

        } catch (SQLException e) {

            throw new RuntimeException(
                    "Khong the doc danh sach san pham tu database.",
                    e
            );
        }
        System.out.println("SO SAN PHAM DOC DUOC = " + products.size());
        
        return products;
    }

    // =========================================================
    // 2. TIM SAN PHAM THEO TEN
    //    HO TRO TIM CO DAU VA KHONG DAU
    // =========================================================
    public List<Product> findByName(String keyword) {

        List<Product> matchedProducts = new ArrayList<>();

        String normalizedKeyword = normalizeText(keyword);

        String sql = """
                SELECT id,
                       name,
                       category,
                       price,
                       shelf_id,
                       x_coord,
                       y_coord,
                       qr_code
                FROM Products
                ORDER BY name
                """;

        try (
            Connection connection = databaseConnection.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql);
            ResultSet resultSet = statement.executeQuery()
        ) {

            while (resultSet.next()) {

                String productName = resultSet.getString("name");

                String normalizedProductName =
                        normalizeText(productName);

                if (normalizedProductName.contains(normalizedKeyword)) {

                    Product product = new Product(
                            resultSet.getString("id"),
                            productName,
                            resultSet.getString("category"),
                            resultSet.getInt("price"),
                            resultSet.getString("shelf_id"),
                            resultSet.getInt("x_coord"),
                            resultSet.getInt("y_coord"),
                            resultSet.getString("qr_code")
                    );

                    matchedProducts.add(product);
                }
            }

        } catch (SQLException e) {

            throw new RuntimeException(
                    "Khong the tim san pham trong database.",
                    e
            );
        }

        return matchedProducts;
    }
    public Product findById(String id) {

        String sql = """
                SELECT id,
                       name,
                       category,
                       price,
                       shelf_id,
                       x_coord,
                       y_coord,
                       qr_code
                FROM Products
                WHERE id = ?
                """;

        try (
            Connection connection = databaseConnection.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {

            statement.setString(1, id);

            try (ResultSet resultSet = statement.executeQuery()) {

                if (resultSet.next()) {

                    return new Product(
                            resultSet.getString("id"),
                            resultSet.getString("name"),
                            resultSet.getString("category"),
                            resultSet.getInt("price"),
                            resultSet.getString("shelf_id"),
                            resultSet.getInt("x_coord"),
                            resultSet.getInt("y_coord"),
                            resultSet.getString("qr_code")
                    );
                }
            }

        } catch (SQLException e) {

            throw new RuntimeException(
                    "Khong the tim san pham theo ID.",
                    e
            );
        }

        return null;
    }
    public Product findByQrCode(String qrCode) {

        String sql = """
                SELECT id,
                       name,
                       category,
                       price,
                       shelf_id,
                       x_coord,
                       y_coord,
                       qr_code
                FROM Products
                WHERE qr_code = ?
                """;

        try (
            Connection connection = databaseConnection.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {

            statement.setString(1, qrCode);

            try (ResultSet resultSet = statement.executeQuery()) {

                if (resultSet.next()) {

                    return new Product(
                            resultSet.getString("id"),
                            resultSet.getString("name"),
                            resultSet.getString("category"),
                            resultSet.getInt("price"),
                            resultSet.getString("shelf_id"),
                            resultSet.getInt("x_coord"),
                            resultSet.getInt("y_coord"),
                            resultSet.getString("qr_code")
                    );
                }
            }

        } catch (SQLException e) {

            throw new RuntimeException(
                    "Khong the tim san pham theo ma QR.",
                    e
            );
        }

        return null;
    }
    public boolean save(Product product) {

        String sql = """
                INSERT INTO Products
                (
                    id,
                    name,
                    category,
                    price,
                    shelf_id,
                    x_coord,
                    y_coord,
                    qr_code
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (
            Connection connection = databaseConnection.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {

            statement.setString(1, product.getId());
            statement.setString(2, product.getName());
            statement.setString(3, product.getCategory());
            statement.setInt(4, product.getPrice());
            statement.setString(5, product.getShelfId());
            statement.setInt(6, product.getXCoord());
            statement.setInt(7, product.getYCoord());
            statement.setString(8, product.getQrCode());

            int rowsAffected = statement.executeUpdate();

            return rowsAffected > 0;

        } catch (SQLException e) {

            throw new RuntimeException(
                    "Khong the them san pham vao database.",
                    e
            );
        }
    }
    public boolean update(Product product) {

        String sql = """
                UPDATE Products
                SET name = ?,
                    category = ?,
                    price = ?,
                    shelf_id = ?,
                    x_coord = ?,
                    y_coord = ?,
                    qr_code = ?
                WHERE id = ?
                """;

        try (
            Connection connection = databaseConnection.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {

            statement.setString(1, product.getName());
            statement.setString(2, product.getCategory());
            statement.setInt(3, product.getPrice());
            statement.setString(4, product.getShelfId());
            statement.setInt(5, product.getXCoord());
            statement.setInt(6, product.getYCoord());
            statement.setString(7, product.getQrCode());

            statement.setString(8, product.getId());

            int rowsAffected = statement.executeUpdate();

            return rowsAffected > 0;

        } catch (SQLException e) {

            throw new RuntimeException(
                    "Khong the cap nhat san pham trong database.",
                    e
            );
        }
    }
    public boolean deleteById(String id) {

        String sql = """
                DELETE FROM Products
                WHERE id = ?
                """;

        try (
            Connection connection = databaseConnection.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {

            statement.setString(1, id);

            int rowsAffected = statement.executeUpdate();

            return rowsAffected > 0;

        } catch (SQLException e) {

            throw new RuntimeException(
                    "Khong the xoa san pham khoi database.",
                    e
            );
        }
    }

    // =========================================================
    // 3. CHUAN HOA CHUOI TIENG VIET
    // =========================================================
    private String normalizeText(String text) {

        if (text == null) {
            return "";
        }

        String normalized = Normalizer.normalize(
                text,
                Normalizer.Form.NFD
        );

        // Xoa dau tieng Viet
        normalized = normalized.replaceAll("\\p{M}", "");

        // Xu ly rieng chu d / D
        normalized = normalized
                .replace("đ", "d")
                .replace("Đ", "D");

        // Chuyen ve chu thuong
        return normalized
                .toLowerCase(Locale.ROOT)
                .trim();
    }
    public void debugDatabase() {
        try (Connection connection =
                     databaseConnection.getConnection()) {

            System.out.println("========== KIEM TRA DATABASE ==========");
            System.out.println(
                    "JDBC URL = " + connection.getMetaData().getURL()
            );

            String sql = "SELECT COUNT(*) FROM Products";

            try (
                PreparedStatement statement =
                        connection.prepareStatement(sql);
                ResultSet resultSet = statement.executeQuery()
            ) {
                if (resultSet.next()) {
                    System.out.println(
                            "JDBC COUNT(*) = " + resultSet.getInt(1)
                    );
                }
            }

            try (
                PreparedStatement statement =
                        connection.prepareStatement("PRAGMA database_list");
                ResultSet resultSet = statement.executeQuery()
            ) {
                while (resultSet.next()) {
                    System.out.println(
                            "SQLITE FILE = " + resultSet.getString("file")
                    );
                }
            }

            System.out.println("======================================");

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
