package com.smartcart.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcart.model.Product;
import com.smartcart.service.GeminiService;
import com.smartcart.service.ProductService;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/chat")
public class GeminiController {

    private static final int MAX_SEARCH_RESULTS = 8;

    private static final int MAX_PRODUCTS_PER_INGREDIENT = 3;

    private final GeminiService geminiService;

    private final ProductService productService;

    private final ObjectMapper objectMapper;

    // =====================================================
    // CAC TU KHONG DUNG DE TIM KIEM SAN PHAM
    // =====================================================

    private static final Set<String> STOP_WORDS =
            new HashSet<>(Arrays.asList(
                (
                    "toi minh ban muon mua tim cho xem " +
                    "hay liet ke cac san pham hien co " +
                    "trong sieu thi he thong du lieu " +
                    "gia ban vi tri ke hang thong tin " +
                    "danh sach loai nao nhung nhieu " +
                    "bao nhieu gia tien cua kem theo " +
                    "chi su dung can giup vui long " +
                    "khong duoc mot so ve va la " +
                    "tai dau o dau dang con hay " +
                    "hien tai ten ma so"
                ).split("\\s+")
            ));

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public GeminiController(
            GeminiService geminiService,
            ProductService productService,
            ObjectMapper objectMapper) {

        this.geminiService = geminiService;

        this.productService = productService;

        this.objectMapper = objectMapper;
    }

    // =====================================================
    // API CHATBOT
    // =====================================================

    @PostMapping("/gemini")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestBody Map<String, String> request) {

        String message = request == null
                ? null
                : request.get("message");

        if (message == null || message.isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Vui long nhap noi dung."
                    )
            );
        }

        try {

            // =============================================
            // 1. XU LY YEU CAU GOI Y MON AN
            // =============================================

            if (isRecipeRequest(message)) {

                return handleRecipeRequest(message);
            }

            // =============================================
            // 2. TIM SAN PHAM TRONG DATABASE
            // =============================================

            List<Product> allProducts =
                    productService.getAllProducts();

            if (allProducts == null) {
                allProducts = List.of();
            }

            List<Product> matchedProducts =
                    findProductsForQuery(
                            message,
                            allProducts
                    );

            String normalizedMessage =
                    normalizeName(message);

            int wordCount = normalizedMessage.isBlank()
                    ? 0
                    : normalizedMessage.split("\\s+").length;

            boolean searchRequest =
                    isProductRequest(message)
                    || (
                        wordCount <= 3
                        && !matchedProducts.isEmpty()
                    );

            if (searchRequest) {

                return handleProductSearch(
                        matchedProducts,
                        message,
                        allProducts.isEmpty()
                );
            }

            // =============================================
            // 3. CHAT GEMINI BINH THUONG
            // =============================================

            String reply = geminiService.chat(message);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "type", "chat",
                            "reply", reply
                    )
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            return ResponseEntity.status(
                    HttpStatus.SERVICE_UNAVAILABLE
            ).body(
                    Map.of(
                            "success", false,
                            "message",
                            "Yeu cau bi gian doan. Vui long thu lai."
                    )
            );

        } catch (IOException e) {

            System.err.println(
                    "[GEMINI ERROR] " + e.getMessage()
            );

            // Khong hien thi JSON loi dai tren website.

            return ResponseEntity.status(
                    HttpStatus.BAD_GATEWAY
            ).body(
                    Map.of(
                            "success", false,
                            "message",
                            "Tro ly AI tam thoi khong phan hoi. "
                            + "Ban van co the tim san pham "
                            + "trong sieu thi."
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );

        } catch (IllegalStateException e) {

            System.err.println(
                    "[CHAT ERROR] " + e.getMessage()
            );

            return ResponseEntity.status(
                    HttpStatus.INTERNAL_SERVER_ERROR
            ).body(
                    Map.of(
                            "success", false,
                            "message",
                            "He thong gap loi xu ly yeu cau."
                    )
            );
        }
    }

    // =====================================================
    // XU LY TIM KIEM SAN PHAM
    // =====================================================

    private ResponseEntity<Map<String, Object>>
            handleProductSearch(
                    List<Product> products,
                    String message,
                    boolean databaseEmpty) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("success", true);

        // Giu type chat de tuong thich frontend cu.
        response.put("type", "chat");

        response.put("products", products);

        response.put("totalFound", products.size());

        StringBuilder reply = new StringBuilder();

        if (databaseEmpty) {

            reply.append(
                    "Hien chua co san pham nao "
                    + "trong co so du lieu."
            );

        } else if (products.isEmpty()) {

            reply.append(
                    "Xin loi, hien chua tim thay "
                    + "san pham phu hop voi yeu cau: "
            );

            reply.append(message);

            reply.append(
                    "\n\nBan hay thu tim bang "
                    + "ten san pham khac."
            );

        } else {

            reply.append(
                    "Da tim thay cac san pham "
                    + "phu hop trong sieu thi:\n\n"
            );

            for (int i = 0; i < products.size(); i++) {

                Product product = products.get(i);

                reply.append(i + 1)
                        .append(". ")
                        .append(product.getName())
                        .append("\n");

                reply.append("   Gia: ")
                        .append(formatPrice(
                                product.getPrice()
                        ))
                        .append("\n");

                reply.append("   Vi tri: Ke ")
                        .append(product.getShelfId())
                        .append("\n");

                reply.append("   Ma san pham: ")
                        .append(product.getId())
                        .append("\n\n");
            }

            reply.append(
                    "Ban co the chon san pham "
                    + "de them vao gio hang."
            );
        }

        response.put("reply", reply.toString());

        return ResponseEntity.ok(response);
    }

    // =====================================================
    // TIM SAN PHAM THEO NOI DUNG CAU HOI
    // =====================================================

    private List<Product> findProductsForQuery(
            String message,
            List<Product> allProducts) {

        String normalized = normalizeName(message);

        if (normalized.isBlank()) {
            return List.of();
        }

        List<String> keywords = new ArrayList<>();

        for (String word : normalized.split("\\s+")) {

            if (
                (word.length() >= 3
                 || word.equals("mi")
                 || word.equals("ga")
                 || word.equals("bo")
                 || word.equals("ca"))
                && !STOP_WORDS.contains(word)
                && !keywords.contains(word)
            ) {

                keywords.add(word);
            }
        }

        if (keywords.isEmpty()) {
            return List.of();
        }

        List<Product> matched = new ArrayList<>();

        for (Product product : allProducts) {

            if (product == null
                    || product.getName() == null) {
                continue;
            }

            if (scoreProduct(product, keywords) > 0) {

                matched.add(product);
            }
        }

        matched.sort(
                Comparator.comparingInt(
                        (Product p) ->
                                scoreProduct(p, keywords)
                ).reversed()
        );

        return matched.stream()
                .limit(MAX_SEARCH_RESULTS)
                .toList();
    }

    // =====================================================
    // TINH DO PHU HOP CUA SAN PHAM
    // =====================================================

    private int scoreProduct(
            Product product,
            List<String> keywords) {

        String name = " "
                + normalizeName(product.getName())
                + " ";

        int score = 0;

        for (String keyword : keywords) {

            if (name.contains(" " + keyword + " ")) {

                score++;
            }
        }

        return score;
    }

    // =====================================================
    // NHAN DIEN YEU CAU TIM SAN PHAM
    // =====================================================

    private boolean isProductRequest(String message) {

        String text = normalizeName(message);

        String[] keywords = {
                "tim ",
                "muon mua",
                "can mua",
                "mua ",
                "san pham",
                "liet ke",
                "gia ban",
                "gia tien",
                "bao nhieu tien",
                "vi tri ke",
                "co ban",
                "con hang",
                "hien co",
                "cho xem"
        };

        for (String keyword : keywords) {

            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    // =====================================================
    // DINH DANG GIA TIEN
    // =====================================================

    private String formatPrice(Object price) {

        if (price == null) {
            return "Chua cap nhat";
        }

        try {

            BigDecimal value = new BigDecimal(
                    price.toString()
            );

            NumberFormat formatter =
                    NumberFormat.getNumberInstance(
                            Locale.forLanguageTag("vi-VN")
                    );

            formatter.setMaximumFractionDigits(2);

            return formatter.format(value) + " VND";

        } catch (NumberFormatException e) {

            return price.toString();
        }
    }

    // =====================================================
    // GOI Y MON AN BANG GEMINI
    // =====================================================

    private ResponseEntity<Map<String, Object>>
            handleRecipeRequest(String message)
            throws IOException, InterruptedException {

        String jsonText =
                geminiService.suggestRecipeJson(message);

        JsonNode recipe = parseRecipeJson(jsonText);

        String recipeName =
                recipe.path("recipeName")
                        .asText("Mon an goi y");

        int servings =
                recipe.path("servings")
                        .asInt(0);

        long estimatedBudget =
                recipe.path("estimatedBudgetVnd")
                        .asLong(0);

        JsonNode ingredientsNode =
                recipe.path("ingredients");

        if (!ingredientsNode.isArray()) {

            throw new IOException(
                    "Danh sach nguyen lieu khong hop le."
            );
        }

        List<Product> allProducts =
                productService.getAllProducts();

        if (allProducts == null) {
            allProducts = List.of();
        }

        List<Map<String, Object>> availableIngredients =
                new ArrayList<>();

        for (JsonNode ingredient : ingredientsNode) {

            String ingredientName =
                    ingredient.path("name")
                            .asText("")
                            .trim();

            String quantity =
                    ingredient.path("quantity")
                            .asText("")
                            .trim();

            if (ingredientName.isBlank()) {
                continue;
            }

            List<Product> matches =
                    findMatchingProducts(
                            ingredientName,
                            allProducts
                    );

            if (matches.isEmpty()) {
                continue;
            }

            List<Product> limitedProducts =
                    matches.stream()
                            .limit(
                                    MAX_PRODUCTS_PER_INGREDIENT
                            )
                            .toList();

            Map<String, Object> item =
                    new LinkedHashMap<>();

            item.put("name", ingredientName);

            item.put("quantity", quantity);

            item.put("found", true);

            item.put("products", limitedProducts);

            availableIngredients.add(item);
        }

        StringBuilder reply = new StringBuilder();

        reply.append("🍲 ")
                .append(recipeName)
                .append("\n");

        if (servings > 0) {

            reply.append("👥 ")
                    .append(servings)
                    .append(" nguoi\n");
        }

        if (estimatedBudget > 0) {

            reply.append("💰 Chi phi du kien: ")
                    .append(
                            String.format(
                                    Locale.forLanguageTag("vi-VN"),
                                    "%,d",
                                    estimatedBudget
                            )
                    )
                    .append(" VND\n");
        }

        if (availableIngredients.isEmpty()) {

            reply.append(
                    "\nChua tim thay san pham phu hop "
                    + "trong sieu thi."
            );

        } else {

            reply.append(
                    "\n🛒 San pham co san trong sieu thi:"
            );
        }

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("success", true);

        response.put("type", "recipe");

        response.put("reply", reply.toString());

        response.put("recipeName", recipeName);

        response.put("servings", servings);

        response.put(
                "estimatedBudgetVnd",
                estimatedBudget
        );

        response.put(
                "ingredients",
                availableIngredients
        );

        return ResponseEntity.ok(response);
    }

    // =====================================================
    // TIM SAN PHAM PHU HOP NGUYEN LIEU
    // =====================================================

    private List<Product> findMatchingProducts(
            String ingredientName,
            List<Product> allProducts) {

        String target = normalizeName(
                ingredientName
        );

        if (target.isBlank()) {
            return List.of();
        }

        target = target.replace(
                "dau phu",
                "dau hu"
        );

        List<Product> matches = new ArrayList<>();

        for (Product product : allProducts) {

            if (product == null
                    || product.getName() == null) {
                continue;
            }

            String productName =
                    normalizeName(product.getName());

            boolean phraseMatch =
                    productName.contains(target)
                    || (
                        target.contains(productName)
                        && productName.length() >= 6
                        && productName.split("\\s+").length >= 2
                    );

            boolean tofuMatch =
                    target.startsWith("dau hu")
                    && productName.startsWith("dau hu");

            if (phraseMatch || tofuMatch) {

                matches.add(product);
            }
        }

        return matches;
    }

    // =====================================================
    // CHUAN HOA TIENG VIET
    // =====================================================

    private String normalizeName(String value) {

        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(
                value.toLowerCase(Locale.ROOT),
                Normalizer.Form.NFD
        );

        return normalized
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    // =====================================================
    // NHAN DIEN YEU CAU GOI Y MON AN
    // =====================================================

    private boolean isRecipeRequest(String message) {

        String normalized = normalizeName(message);

        String[] keywords = {
                "nau gi",
                "mon an",
                "goi y mon",
                "ngan sach",
                "lam mon",
                "che bien",
                "cong thuc",
                "mon lau",
                "lau ga",
                "lau thai",
                "ga ran",
                "thuc don",
                "an gi",
                "nguyen lieu"
        };

        for (String keyword : keywords) {

            if (normalized.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    // =====================================================
    // DOC JSON CONG THUC TU GEMINI
    // =====================================================

    private JsonNode parseRecipeJson(String text)
            throws IOException {

        String json = text == null
                ? ""
                : text.trim();

        if (json.startsWith("```")) {

            json = json.replaceFirst(
                    "^```(?:json)?\\s*",
                    ""
            );

            json = json.replaceFirst(
                    "\\s*```$",
                    ""
            ).trim();
        }

        try {

            JsonNode recipe =
                    objectMapper.readTree(json);

            if (recipe == null || !recipe.isObject()) {

                throw new IOException(
                        "JSON mon an khong hop le."
                );
            }

            if (!recipe.path("ingredients").isArray()) {

                throw new IOException(
                        "JSON khong co ingredients."
                );
            }

            return recipe;

        } catch (Exception e) {

            System.err.println(
                    "[GEMINI JSON ERROR] " + e.getMessage()
            );

            throw new IOException(
                    "Khong doc duoc JSON mon an tu Gemini.",
                    e
            );
        }
    }
}