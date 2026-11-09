package com.smartcart.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.RoutePoint;
import com.smartcart.dto.RouteProductRequest;
import com.smartcart.dto.RouteRequest;
import com.smartcart.dto.RouteResponse;

@RestController
@RequestMapping("/api")
public class RouteController {

    // =====================================================
    // CAU HINH BAN DO V6
    // =====================================================

    private static final int MIN_X = 1;
    private static final int MAX_X = 79;

    private static final int MIN_Y = 1;
    private static final int MAX_Y = 119;

    private static final int INF = 1_000_000;

    private static final double CLEARANCE_CM = 4.0;

    private static final double[] CENTER_X = {
        16, 30.5, 45, 59.5
    };

    private static final int[] CENTER_Y = {
        17, 78
    };

    private static final int[] ACCESS_X = {
        25, 40, 54, 69
    };

    private static final int[][] ACCESS_Y = {
        {22, 30, 38},
        {83, 91, 99}
    };

    private static final int[][] DIRECTIONS = {
        {1, 0},
        {0, 1},
        {-1, 0},
        {0, -1}
    };

    private static final double[][] BLOCKS = buildBlocks();


    // =====================================================
    // DANH SACH VAT CAN
    // =====================================================

    private static double[][] buildBlocks() {
        List<double[]> blocks = new ArrayList<>();

        // 8 ke giua
        for (int y : CENTER_Y) {
            for (double x : CENTER_X) {
                blocks.add(
                    new double[]{x, y, 4.5, 25}
                );
            }
        }

        // Ke phia sau
        blocks.add(new double[]{3, 3, 13, 3.5});
        blocks.add(new double[]{19, 3, 42, 3.5});
        blocks.add(new double[]{64, 3, 13, 3.5});

        // Ke hai ben
        for (int x : new int[]{2, 74}) {
            for (int y : new int[]{11, 70}) {
                blocks.add(
                    new double[]{x, y, 4, 35}
                );
            }
        }

        // Quay am thuc
        blocks.add(
            new double[]{17, 54, 46, 12}
        );

        // EX va KHO
        blocks.add(new double[]{74, 51, 4, 7});
        blocks.add(new double[]{74, 61, 4, 7});

        // Ba quay thanh toan
        for (int x : new int[]{30, 45, 60}) {
            blocks.add(
                new double[]{x, 113, 12, 5}
            );
        }

        return blocks.toArray(new double[0][]);
    }


    // =====================================================
    // API TAO LO TRINH
    // =====================================================

    @PostMapping("/generate-route")
    public ApiResponse<RouteResponse> generateRoute(
            @RequestBody RouteRequest request) {

        if (request == null ||
                request.getStartPoint() == null) {

            return error(
                "Thieu vi tri bat dau cua xe"
            );
        }

        if (request.getProducts() == null ||
                request.getProducts().isEmpty()) {

            return error(
                "Gio hang dang rong"
            );
        }

        RoutePoint start = new RoutePoint(
            request.getStartPoint().getX(),
            request.getStartPoint().getY()
        );

        if (!isWalkable(start.getX(), start.getY())) {
            return error(
                "Vi tri xe khong nam tren loi di. " +
                "Hay dua xe ve CUA VAO, toa do (17,111)."
            );
        }

        Set<String> shelfIds = new LinkedHashSet<>();

        for (RouteProductRequest product : request.getProducts()) {

            if (product == null ||
                    product.getShelfId() == null) {
                continue;
            }

            String id = product.getShelfId()
                .trim()
                .toUpperCase(Locale.ROOT);

            if (id.matches("[A-H]")) {
                id += "1";
            }

            if (getShelfPoint(id) != null) {
                shelfIds.remove(id);
                shelfIds.add(id);
            }
        }

        if (shelfIds.isEmpty()) {
            return error(
                "Khong tim thay ma ke hop le trong gio hang"
            );
        }

        List<String> ids = new ArrayList<>(shelfIds);

        String finalShelfId = ids.remove(ids.size() - 1);

        RoutePoint end = getShelfPoint(finalShelfId);

        List<RoutePoint> middle = new ArrayList<>();

        for (String id : ids) {
            middle.add(
                getShelfPoint(id)
            );
        }

        Map<String, List<RoutePoint>> cache = new HashMap<>();

        List<RoutePoint> order;

        if (middle.size() <= 10) {
            order = bestOrderExact(
                start, middle, end, cache
            );
        } else {
            order = bestOrderHeuristic(
                start, middle, end, cache
            );
        }

        if (order == null) {
            return error(
                "Khong tim thay duong di den mot hoac nhieu ke hang"
            );
        }

        order.add(end);

        List<RoutePoint> route = new ArrayList<>();

        addPoint(route, start);

        RoutePoint current = start;

        for (RoutePoint target : order) {

            List<RoutePoint> segment = shortestPath(
                current, target, cache
            );

            if (segment == null) {
                return error(
                    "Khong tim thay duong di tranh ke hang"
                );
            }

            appendTurnPoints(route, segment);

            current = target;
        }

        if (route.size() == 1) {
            route.add(
                new RoutePoint(
                    end.getX(),
                    end.getY()
                )
            );
        }

        RouteResponse response = new RouteResponse(route);

        return new ApiResponse<>(
            true,
            "Da tao lo trinh. Ket thuc tai ke " + finalShelfId,
            response
        );
    }


    // =====================================================
    // THONG BAO LOI
    // =====================================================

    private ApiResponse<RouteResponse> error(String message) {
        return new ApiResponse<>(
            false,
            message,
            null
        );
    }


    // =====================================================
    // TIM TOA DO KE
    // =====================================================

    private RoutePoint getShelfPoint(String id) {

        if (id == null) {
            return null;
        }

        if (
            "FOOD".equals(id) ||
            "DELI".equals(id) ||
            "AM-THUC".equals(id)
        ) {
            return new RoutePoint(40, 49);
        }

        if (id.matches("K[1-8]")) {
            int index = id.charAt(1) - '1';
            int row = index / 4;
            int col = index % 4;

            return new RoutePoint(
                ACCESS_X[col],
                ACCESS_Y[row][1]
            );
        }

        if (!id.matches("[A-H][1-3]")) {
            return null;
        }

        int index = id.charAt(0) - 'A';
        int part = id.charAt(1) - '1';

        int row = index / 4;
        int col = index % 4;

        return new RoutePoint(
            ACCESS_X[col],
            ACCESS_Y[row][part]
        );
    }


    // =====================================================
    // KIEM TRA LOI DI VA VAT CAN
    // =====================================================

    private boolean isWalkable(int x, int y) {

        if (
            x < MIN_X || x > MAX_X ||
            y < MIN_Y || y > MAX_Y
        ) {
            return false;
        }

        for (double[] b : BLOCKS) {

            if (
                x >= b[0] - CLEARANCE_CM &&
                x <= b[0] + b[2] + CLEARANCE_CM &&
                y >= b[1] - CLEARANCE_CM &&
                y <= b[1] + b[3] + CLEARANCE_CM
            ) {
                return false;
            }
        }

        return true;
    }


    // =====================================================
    // NODE THUAT TOAN A*
    // =====================================================

    private static class Node {

        final int x;
        final int y;

        final int direction;
        final int g;
        final int f;

        final Node previous;

        Node(
            int x,
            int y,
            int direction,
            int g,
            int f,
            Node previous
        ) {
            this.x = x;
            this.y = y;
            this.direction = direction;
            this.g = g;
            this.f = f;
            this.previous = previous;
        }
    }


    // =====================================================
    // THUAT TOAN A*
    // =====================================================

    private List<RoutePoint> shortestPath(
            RoutePoint from,
            RoutePoint to,
            Map<String, List<RoutePoint>> cache) {

        String key = pointKey(from) + ">" + pointKey(to);

        if (cache.containsKey(key)) {
            return cache.get(key);
        }

        String reverseKey = pointKey(to) + ">" + pointKey(from);

        if (cache.containsKey(reverseKey)) {

            List<RoutePoint> reversed = cache.get(reverseKey);

            if (reversed == null) {
                cache.put(key, null);
                return null;
            }

            List<RoutePoint> path = new ArrayList<>(reversed);

            Collections.reverse(path);

            cache.put(key, path);

            return path;
        }

        int sx = from.getX();
        int sy = from.getY();

        int tx = to.getX();
        int ty = to.getY();

        if (
            !isWalkable(sx, sy) ||
            !isWalkable(tx, ty)
        ) {
            cache.put(key, null);
            return null;
        }

        if (sx == tx && sy == ty) {

            List<RoutePoint> singleton = List.of(
                new RoutePoint(sx, sy)
            );

            cache.put(key, singleton);

            return singleton;
        }

        int[][][] best = new int[81][121][4];

        for (int[][] rows : best) {
            for (int[] dirs : rows) {
                Arrays.fill(dirs, INF);
            }
        }

        PriorityQueue<Node> queue = new PriorityQueue<>(
            Comparator
                .comparingInt((Node node) -> node.f)
                .thenComparingInt(node -> -node.g)
        );

        queue.add(
            new Node(
                sx,
                sy,
                -1,
                0,
                manhattan(sx, sy, tx, ty) * 1000,
                null
            )
        );

        while (!queue.isEmpty()) {

            Node current = queue.poll();

            if (
                current.direction >= 0 &&
                current.g != best[current.x][current.y][current.direction]
            ) {
                continue;
            }

            if (current.x == tx && current.y == ty) {

                List<RoutePoint> path = new ArrayList<>();

                for (
                    Node node = current;
                    node != null;
                    node = node.previous
                ) {
                    path.add(
                        new RoutePoint(
                            node.x,
                            node.y
                        )
                    );
                }

                Collections.reverse(path);

                cache.put(key, path);

                return path;
            }

            for (int direction = 0; direction < 4; direction++) {

                int nx = current.x + DIRECTIONS[direction][0];
                int ny = current.y + DIRECTIONS[direction][1];

                if (!isWalkable(nx, ny)) {
                    continue;
                }

                int turnCost =
                    current.direction >= 0 &&
                    current.direction != direction
                    ? 1
                    : 0;

                int nextG = current.g + 1000 + turnCost;

                if (nextG >= best[nx][ny][direction]) {
                    continue;
                }

                best[nx][ny][direction] = nextG;

                int f = nextG +
                    manhattan(nx, ny, tx, ty) * 1000;

                queue.add(
                    new Node(
                        nx,
                        ny,
                        direction,
                        nextG,
                        f,
                        current
                    )
                );
            }
        }

        cache.put(key, null);

        return null;
    }


    // =====================================================
    // TAO KHOA TOA DO
    // =====================================================

    private String pointKey(RoutePoint p) {
        return p.getX() + ":" + p.getY();
    }


    // =====================================================
    // KHOANG CACH MANHATTAN
    // =====================================================

    private int manhattan(
        int x1,
        int y1,
        int x2,
        int y2
    ) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }


    // =====================================================
    // TINH DO DAI DUONG DI
    // =====================================================

    private int distance(
        RoutePoint a,
        RoutePoint b,
        Map<String, List<RoutePoint>> cache
    ) {
        List<RoutePoint> path = shortestPath(a, b, cache);

        return path == null
            ? INF
            : path.size() - 1;
    }


    // =====================================================
    // TOI UU CHINH XAC THU TU GHE KE
    // =====================================================

    private List<RoutePoint> bestOrderExact(
        RoutePoint start,
        List<RoutePoint> middle,
        RoutePoint end,
        Map<String, List<RoutePoint>> cache
    ) {
        int n = middle.size();

        if (n == 0) {
            return distance(start, end, cache) >= INF
                ? null
                : new ArrayList<>();
        }

        int full = (1 << n) - 1;

        int[][] dp = new int[full + 1][n];
        int[][] parent = new int[full + 1][n];

        for (int i = 0; i <= full; i++) {
            Arrays.fill(dp[i], INF);
            Arrays.fill(parent[i], -1);
        }

        for (int i = 0; i < n; i++) {
            dp[1 << i][i] = distance(
                start,
                middle.get(i),
                cache
            );
        }

        for (int mask = 1; mask <= full; mask++) {

            for (int last = 0; last < n; last++) {

                if (
                    (mask & (1 << last)) == 0 ||
                    dp[mask][last] >= INF
                ) {
                    continue;
                }

                for (int next = 0; next < n; next++) {

                    if ((mask & (1 << next)) != 0) {
                        continue;
                    }

                    int nextMask = mask | (1 << next);

                    int cost =
                        dp[mask][last] +
                        distance(
                            middle.get(last),
                            middle.get(next),
                            cache
                        );

                    if (cost < dp[nextMask][next]) {
                        dp[nextMask][next] = cost;
                        parent[nextMask][next] = last;
                    }
                }
            }
        }

        int finalCost = INF;
        int lastIndex = -1;

        for (int i = 0; i < n; i++) {

            int cost =
                dp[full][i] +
                distance(
                    middle.get(i),
                    end,
                    cache
                );

            if (cost < finalCost) {
                finalCost = cost;
                lastIndex = i;
            }
        }

        if (lastIndex == -1) {
            return null;
        }

        List<RoutePoint> order = new ArrayList<>();

        int mask = full;

        while (lastIndex != -1) {

            order.add(middle.get(lastIndex));

            int previous = parent[mask][lastIndex];

            mask ^= 1 << lastIndex;
            lastIndex = previous;
        }

        Collections.reverse(order);

        return order;
    }


    // =====================================================
    // TOI UU GAN DUNG KHI CO NHIEU KE
    // =====================================================

    private List<RoutePoint> bestOrderHeuristic(
        RoutePoint start,
        List<RoutePoint> middle,
        RoutePoint end,
        Map<String, List<RoutePoint>> cache
    ) {
        List<RoutePoint> pending = new ArrayList<>(middle);
        List<RoutePoint> order = new ArrayList<>();

        RoutePoint current = start;

        while (!pending.isEmpty()) {

            RoutePoint best = null;
            int bestDistance = INF;

            for (RoutePoint candidate : pending) {

                int dist = distance(
                    current,
                    candidate,
                    cache
                );

                if (dist < bestDistance) {
                    best = candidate;
                    bestDistance = dist;
                }
            }

            if (best == null) {
                return null;
            }

            order.add(best);
            pending.remove(best);

            current = best;
        }

        if (distance(current, end, cache) >= INF) {
            return null;
        }

        boolean improved;
        int rounds = 0;

        do {
            improved = false;

            for (int i = 0; i < order.size(); i++) {

                for (int j = i + 1; j < order.size(); j++) {

                    RoutePoint before = i == 0
                        ? start
                        : order.get(i - 1);

                    RoutePoint after = j == order.size() - 1
                        ? end
                        : order.get(j + 1);

                    int oldDistance =
                        distance(before, order.get(i), cache) +
                        distance(order.get(j), after, cache);

                    int newDistance =
                        distance(before, order.get(j), cache) +
                        distance(order.get(i), after, cache);

                    if (newDistance < oldDistance) {

                        Collections.reverse(
                            order.subList(i, j + 1)
                        );

                        improved = true;
                    }
                }
            }

            rounds++;

        } while (improved && rounds < 3);

        return order;
    }


    // =====================================================
    // RUT GON CAC DIEM TREN TUYEN DUONG
    // =====================================================

    private void appendTurnPoints(
        List<RoutePoint> route,
        List<RoutePoint> path
    ) {
        for (int i = 0; i < path.size(); i++) {

            boolean keep =
                i == 0 ||
                i == path.size() - 1;

            if (!keep) {

                RoutePoint a = path.get(i - 1);
                RoutePoint b = path.get(i);
                RoutePoint c = path.get(i + 1);

                keep =
                    b.getX() - a.getX() != c.getX() - b.getX()
                    ||
                    b.getY() - a.getY() != c.getY() - b.getY();
            }

            if (keep) {
                addPoint(route, path.get(i));
            }
        }
    }


    // =====================================================
    // THEM DIEM VA LOAI BO DIEM TRUNG
    // =====================================================

    private void addPoint(
        List<RoutePoint> route,
        RoutePoint point
    ) {
        if (!route.isEmpty()) {

            RoutePoint last = route.get(route.size() - 1);

            if (
                last.getX() == point.getX() &&
                last.getY() == point.getY()
            ) {
                return;
            }
        }

        route.add(
            new RoutePoint(
                point.getX(),
                point.getY()
            )
        );
    }
}