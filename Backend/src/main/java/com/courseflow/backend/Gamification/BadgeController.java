package com.courseflow.backend.Gamification;

import com.courseflow.backend.Users.JwtService;
import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/gamification")
@CrossOrigin(origins = "*")
public class BadgeController {

    @Autowired private BadgeService badgeService;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;

    // Per-user cooldown: skip full re-evaluation if one ran within this window.
    private static final int EVALUATE_COOLDOWN_MINUTES = 5;
    private final ConcurrentHashMap<Long, LocalDateTime> lastEvaluated = new ConcurrentHashMap<>();

    // Full badge catalog with earned status for the current user
    @GetMapping("/badges")
    public ResponseEntity<?> getMyBadges(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            return ResponseEntity.ok(badgeService.getUserBadgesResponse(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // Publicly visible earned badges for any user (used by friends feature)
    @GetMapping("/user/{userId}/badges")
    public ResponseEntity<?> getUserBadges(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(badgeService.getPublicBadgesForUser(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // Pending badge notifications — drains the queue (marks as seen)
    @GetMapping("/notifications")
    @Transactional
    public ResponseEntity<?> getNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            return ResponseEntity.ok(badgeService.drainNotifications(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // Full re-evaluation of all badges for the current user.
    // Skipped (returns cached result) if evaluated within the cooldown window.
    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluate(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            LocalDateTime lastRun = lastEvaluated.get(userId);
            if (lastRun != null && lastRun.isAfter(LocalDateTime.now().minusMinutes(EVALUATE_COOLDOWN_MINUTES))) {
                Map<String, Object> cached = new java.util.HashMap<>();
                cached.put("newBadges", List.of());
                cached.put("totalBadges", badgeService.getBadgeCount(userId));
                cached.put("skipped", true);
                return ResponseEntity.ok(cached);
            }

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "User not found"));

            User user = userOpt.get();
            List<BadgeKey> earned = badgeService.evaluateDegreeBadges(user);
            earned.addAll(badgeService.evaluateProfileBadges(user));

            lastEvaluated.put(userId, LocalDateTime.now());

            Map<String, Object> result = new java.util.HashMap<>();
            result.put("newBadges", earned.stream().map(Enum::name).toList());
            result.put("totalBadges", badgeService.getBadgeCount(userId));
            result.put("skipped", false);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // Badge count and level summary for the current user
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            int count = badgeService.getBadgeCount(userId);
            int level = computeLevel(count);
            int nextLevelAt = nextLevelThreshold(level);

            return ResponseEntity.ok(Map.of(
                "totalBadges", count,
                "level", level,
                "levelLabel", "Level " + level + " Planner",
                "nextLevelAt", nextLevelAt,
                "progressToNextLevel", nextLevelAt > 0 ? (double) count / nextLevelAt : 1.0
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.replace("Bearer ", "");
        return jwtService.extractUserId(token);
    }

    private int computeLevel(int badgeCount) {
        if (badgeCount >= 10) return 5;
        if (badgeCount >= 7) return 4;
        if (badgeCount >= 4) return 3;
        if (badgeCount >= 2) return 2;
        return 1;
    }

    private int nextLevelThreshold(int level) {
        return switch (level) {
            case 1 -> 2;
            case 2 -> 4;
            case 3 -> 7;
            case 4 -> 10;
            default -> 10;
        };
    }
}
