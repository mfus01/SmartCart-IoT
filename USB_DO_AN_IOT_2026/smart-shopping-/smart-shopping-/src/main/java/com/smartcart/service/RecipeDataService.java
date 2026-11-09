package com.smartcart.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class RecipeDataService {

    private final String databasePath;
    private final ObjectMapper mapper;

    public RecipeDataService(
            @Value("${smartcart.sqlite.path}") String databasePath,
            ObjectMapper mapper) {

        this.databasePath = databasePath;
        this.mapper = mapper;
    }

    // =====================================================
    // 1. CHUAN HOA TIENG VIET DE TIM KIEM
    // =====================================================

    private String normalize(String value) {

        if (value == null) {
            return "";
        }

        String text = Normalizer.normalize(
            value.toLowerCase(Locale.ROOT),
            Normalizer.Form.NFD
        );

        return text
            .replaceAll("\\p{M}", "")
            .replace("đ", "d")
            .replaceAll("[^a-z0-9 ]", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    // =====================================================
    // 2. DOI TUONG CONG THUC
    // =====================================================

    private record Recipe(
        String code,
        String sauceName,
        String dishName,
        String aliases,
        String required,
        String optional
    ) {}

    // =====================================================
    // 3. DOI TUONG SAN PHAM
    // =====================================================

    private record Product(
        String id,
        String name,
        long price,
        String shelfId
    ) {}

    // =====================================================
    // 4. DOC CONG THUC TU SQLITE
    // =====================================================

    private List<Recipe> loadRecipes(Connection conn)
            throws Exception {

        List<Recipe> recipes = new ArrayList<>();

        String sql = """
            SELECT
                code,
                sauce_name,
                dish_name,
                keyword_aliases,
                required_ingredients,
                optional_ingredients
            FROM sauce_recipe_catalog
            LIMIT 100
            """;

        try (
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(sql)
        ) {

            while (rs.next()) {

                recipes.add(new Recipe(
                    rs.getString("code"),
                    rs.getString("sauce_name"),
                    rs.getString("dish_name"),
                    rs.getString("keyword_aliases"),
                    rs.getString("required_ingredients"),
                    rs.getString("optional_ingredients")
                ));
            }
        }

        return recipes;
    }

    // =====================================================
    // 5. DOC SAN PHAM TU SQLITE
    // =====================================================

    private List<Product> loadProducts(Connection conn)
            throws Exception {

        List<Product> products = new ArrayList<>();

        String sql = """
            SELECT
                id,
                name,
                price,
                shelf_id
            FROM Products
            LIMIT 10000
            """;

        try (
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(sql)
        ) {

            while (rs.next()) {

                products.add(new Product(
                    rs.getString("id"),
                    rs.getString("name"),
                    rs.getLong("price"),
                    rs.getString("shelf_id")
                ));
            }
        }

        return products;
    }

    // =====================================================
    // 6. CHAM DIEM MON AN
    // =====================================================

    private int recipeScore(
            String question,
            Recipe recipe) {

        String q = normalize(question);

        String dish = normalize(recipe.dishName());
        String sauce = normalize(recipe.sauceName());

        int score = 0;

        if (!dish.isEmpty() && q.contains(dish)) {
            score += 100;
        }

        if (!sauce.isEmpty() && q.contains(sauce)) {
            score += 100;
        }

        String[] aliases = recipe.aliases() == null
            ? new String[0]
            : recipe.aliases().split("\\|");

        for (String alias : aliases) {

            String value = normalize(alias);

            if (value.length() >= 4 && q.contains(value)) {
                score += 50;
            }
        }

        for (String token : dish.split(" ")) {

            if (token.length() >= 3 &&
                    q.contains(token)) {

                score += 5;
            }
        }

        return score;
    }

    // =====================================================
    // 7. CHAM DIEM SAN PHAM
    // =====================================================

    private int productScore(
            String keyword,
            Product product) {

        String q = normalize(keyword);
        String name = normalize(product.name());

        if (q.isEmpty()) {
            return 0;
        }

        if (name.equals(q)) {
            return 200;
        }

        if (q.length() >= 3 && name.contains(q)) {
            return 100 + q.length();
        }

        int matched = 0;
        int meaningful = 0;

        for (String token : q.split(" ")) {

            if (token.length() < 3) {
                continue;
            }

            meaningful++;

            if (name.contains(token)) {
                matched++;
            }
        }

        if (meaningful == 0) {
            return 0;
        }

        if (matched >= Math.min(2, meaningful)) {
            return matched * 10;
        }

        return 0;
    }

    // =====================================================
    // 8. TIM SAN PHAM PHU HOP
    // =====================================================

    private List<Product> findProducts(
            String keyword,
            List<Product> products,
            int limit) {

        return products.stream()
            .filter(p -> productScore(keyword, p) > 0)
            .sorted(
                Comparator.comparingInt(
                    (Product p) -> productScore(keyword, p)
                ).reversed()
            )
            .limit(limit)
            .toList();
    }

    // =====================================================
    // 9. DOC DANH SACH NGUYEN LIEU JSON
    // =====================================================

    private List<String> parseIngredients(String json)
            throws Exception {

        List<String> result = new ArrayList<>();

        if (json == null || json.isBlank()) {
            return result;
        }

        JsonNode root = mapper.readTree(json);

        if (root.isArray()) {

            for (JsonNode item : root) {

                if (item.isTextual()) {
                    result.add(item.asText());

                } else if (item.isObject()) {

                    String name = item.path("name").asText("");
                    String amount = item.path("amount_for_4").asText("");

                    if (!name.isBlank()) {
                        result.add(name + " " + amount);
                    }
                }
            }
        }

        return result;
    }

    // =====================================================
    // 10. TACH TEN NGUYEN LIEU KHOI DINH LUONG
    // =====================================================

    private String ingredientKeyword(String ingredient) {

        return ingredient
            .replaceFirst(
                "\\s+\\d+(?:[.,]\\d+)?\\s*" +
                "(?:kg|g|ml|l|quả|trái|củ|cây|" +
                "tép|gói|ổ|nhánh|bó|lá)?.*$",
                ""
            )
            .trim();
    }

    // =====================================================
    // 11. TAO DU LIEU CUNG CAP CHO GEMINI
    // =====================================================

    public String buildContext(
            String question,
            boolean recipeMode) throws IOException {

        Path file = Path.of(databasePath);

        if (!Files.isRegularFile(file)) {

            throw new IOException(
                "Khong tim thay database SQLite: " +
                file.toAbsolutePath()
            );
        }

        StringBuilder context = new StringBuilder();

        try (
            Connection conn = DriverManager.getConnection(
                "jdbc:sqlite:" + file.toAbsolutePath()
            )
        ) {

            List<Recipe> recipes = loadRecipes(conn);
            List<Product> products = loadProducts(conn);

            // ---------------------------------------------
            // TIM CONG THUC PHU HOP
            // ---------------------------------------------

            List<Recipe> matches = recipes.stream()
                .filter(r -> recipeScore(question, r) > 0)
                .sorted(
                    Comparator.comparingInt(
                        (Recipe r) -> recipeScore(question, r)
                    ).reversed()
                )
                .limit(3)
                .toList();

            // Neu nguoi dung chi hoi goi y mon an chung
            if (matches.isEmpty() && recipeMode) {

                Map<String, Recipe> selected =
                    new LinkedHashMap<>();

                for (Recipe r : recipes) {

                    String group = r.code().replaceAll(
                        "\\d+", ""
                    );

                    selected.putIfAbsent(group, r);

                    if (selected.size() >= 6) {
                        break;
                    }
                }

                matches = new ArrayList<>(
                    selected.values()
                );
            }

            context.append(
                "DU LIEU CONG THUC TU SQLITE:\n"
            );

            for (Recipe recipe : matches) {

                context.append("\nMON: ")
                    .append(recipe.dishName());

                context.append("\nGOI SOT: ")
                    .append(recipe.sauceName());

                context.append("\nDINH LUONG MAU: 4 nguoi");

                List<String> ingredients =
                    parseIngredients(recipe.required());

                List<String> optional =
                    parseIngredients(recipe.optional());

                context.append("\nNGUYEN LIEU CAN THIET: ")
                    .append(ingredients);

                context.append("\nNGUYEN LIEU TUY CHON: ")
                    .append(optional);

                // -----------------------------------------
                // KIEM TRA GOI SOT CO TRONG PRODUCTS KHONG
                // -----------------------------------------

                String sauceId = "SOT_" + recipe.code();

                Product sauceProduct = products.stream()
                    .filter(p -> sauceId.equals(p.id()))
                    .findFirst()
                    .orElse(null);

                if (sauceProduct != null) {

                    context.append("\nGOI SOT TRONG PRODUCTS: ")
                        .append(sauceProduct.name())
                        .append(" | ID: ")
                        .append(sauceProduct.id())
                        .append(" | Gia: ")
                        .append(sauceProduct.price())
                        .append(" VND")
                        .append(" | Ke: ")
                        .append(sauceProduct.shelfId());

                } else {

                    context.append(
                        "\nGOI SOT: Chua tim thay ma san pham tuong ung trong Products."
                    );
                }

                // -----------------------------------------
                // TIM CAC SAN PHAM NGUYEN LIEU
                // -----------------------------------------

                context.append(
                    "\nCAC SAN PHAM NGUYEN LIEU TIM DUOC:"
                );

                for (String ingredient : ingredients.stream()
                        .limit(8).toList()) {

                    String keyword =
                        ingredientKeyword(ingredient);

                    List<Product> found = findProducts(
                        keyword,
                        products.stream()
                            .filter(p -> !p.id().startsWith("SOT_"))
                            .toList(),
                        2
                    );

                    context.append("\n- ")
                        .append(ingredient)
                        .append(": ");

                    if (found.isEmpty()) {

                        context.append(
                            "Chua tim thay san pham phu hop."
                        );

                    } else {

                        for (Product p : found) {

                            context.append("[")
                                .append(p.name())
                                .append(", ID=")
                                .append(p.id())
                                .append(", gia=")
                                .append(p.price())
                                .append(" VND, ke=")
                                .append(p.shelfId())
                                .append("] ");
                        }
                    }
                }

                context.append("\n");
            }

            // ---------------------------------------------
            // TIM SAN PHAM TRUC TIEP THEO CAU HOI
            // ---------------------------------------------

            if (!recipeMode) {

                List<Product> direct = findProducts(
                    question,
                    products,
                    8
                );

                if (!direct.isEmpty()) {

                    context.append(
                        "\nSAN PHAM PHU HOP VOI CAU HOI:\n"
                    );

                    for (Product p : direct) {

                        context.append("- ")
                            .append(p.name())
                            .append(" | ")
                            .append(p.price())
                            .append(" VND | Ke ")
                            .append(p.shelfId())
                            .append(" | ID ")
                            .append(p.id())
                            .append("\n");
                    }
                }
            }

            context.append(
                "\nLUU Y: Gia la gia cua don vi san pham " +
                "trong Products, khong mac dinh la gia " +
                "cua dung dinh luong can nau."
            );

            context.append(
                "\nDatabase chua co cot ton kho, " +
                "nen khong duoc khang dinh san pham " +
                "chac chan con hang."
            );

            return context.toString();

        } catch (Exception e) {

            throw new IOException(
                "Khong doc duoc du lieu cong thuc " +
                "hoac san pham tu SQLite.",
                e
            );
        }
    }
}