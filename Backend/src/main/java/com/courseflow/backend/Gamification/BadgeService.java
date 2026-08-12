package com.courseflow.backend.Gamification;

import com.courseflow.backend.Chatbot.Prerequisite;
import com.courseflow.backend.Chatbot.PrerequisiteRepository;
import com.courseflow.backend.DegreePrograms.DegreeType;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlan;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlanRepository;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlanService;
import com.courseflow.backend.Users.Profiles.UserProfile;
import com.courseflow.backend.Users.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    public static class BadgeDefinition {
        public final BadgeKey key;
        public final String name;
        public final String description;
        public final String icon;
        public final String category;

        public BadgeDefinition(BadgeKey key, String name, String description, String icon, String category) {
            this.key = key;
            this.name = name;
            this.description = description;
            this.icon = icon;
            this.category = category;
        }
    }

    public static final List<BadgeDefinition> CATALOG = List.of(
        new BadgeDefinition(BadgeKey.THE_ARCHITECT, "The Architect", "Created your first degree plan.", "construct-outline", "Onboarding"),
        new BadgeDefinition(BadgeKey.THE_SPECIALIST, "The Specialist", "Declared a minor alongside your major.", "ribbon-outline", "Onboarding"),
        new BadgeDefinition(BadgeKey.LOOKING_SHARP, "Looking Sharp", "Uploaded a profile picture.", "camera-outline", "Onboarding"),
        new BadgeDefinition(BadgeKey.GEN_ED_GLADIATOR, "Gen-Ed Gladiator", "Fully satisfied the General Education requirements.", "school-outline", "Academic"),
        new BadgeDefinition(BadgeKey.HALFWAY_THERE, "Halfway There", "Reached 50% total degree completion.", "star-half-outline", "Academic"),
        new BadgeDefinition(BadgeKey.THE_FINISH_LINE, "The Finish Line", "Reached 90%+ total degree completion.", "trophy-outline", "Academic"),
        new BadgeDefinition(BadgeKey.UPPERCLASSMAN_STATUS, "Upperclassman Status", "Reached 90 total earned credits. Welcome to the home stretch!", "medal-outline", "Academic"),
        new BadgeDefinition(BadgeKey.THE_MARATHONER, "The Marathoner", "Reached the 120-credit mark.", "flag-outline", "Academic"),
        new BadgeDefinition(BadgeKey.PREREQUISITE_MASTER, "Prerequisite Master", "Completed a top-tier class by working through a 3-deep prerequisite chain.", "git-branch-outline", "Academic"),
        new BadgeDefinition(BadgeKey.ON_THE_BOOKS, "On The Books", "Booked your first appointment with an advisor through CourseFlow.", "calendar-outline", "Scheduling"),
        new BadgeDefinition(BadgeKey.ADVISORS_RADAR, "Advisor's Radar", "Your advisor left you a note in CourseFlow. You're on their radar!", "chatbubble-outline", "Scheduling")
    );

    private static final Map<BadgeKey, BadgeDefinition> CATALOG_MAP = CATALOG.stream()
        .collect(Collectors.toMap(b -> b.key, b -> b));

    private static final String DEFAULT_PHOTO_URL_FRAGMENT = "istockphoto.com";

    @Autowired private UserBadgeRepository userBadgeRepo;
    @Autowired private UserDegreePlanRepository degreePlanRepo;
    @Autowired private UserDegreePlanService degreePlanService;
    @Autowired private PrerequisiteRepository prerequisiteRepo;

    @Transactional
    public List<BadgeKey> evaluateProfileBadges(User user) {
        List<BadgeKey> newlyEarned = new ArrayList<>();
        UserProfile profile = user.getProfile();
        if (profile == null) return newlyEarned;

        // LOOKING_SHARP: has a non-default profile photo
        if (profile.getPhotoUrl() != null && !profile.getPhotoUrl().contains(DEFAULT_PHOTO_URL_FRAGMENT)) {
            grantIfNotEarned(user, BadgeKey.LOOKING_SHARP).ifPresent(newlyEarned::add);
        }

        // THE_SPECIALIST: has at least one MAJOR and at least one MINOR in user_degree_plans
        // (UserDegreePlan is the source of truth — profile.getMajors/getMinors are not always populated)
        List<UserDegreePlan> declaredPlans = degreePlanRepo.findByUserId(user.getId());
        boolean hasMajor = declaredPlans.stream().anyMatch(p -> p.getDegreeType() == DegreeType.MAJOR);
        boolean hasMinor = declaredPlans.stream().anyMatch(p -> p.getDegreeType() == DegreeType.MINOR);
        if (hasMajor && hasMinor) {
            grantIfNotEarned(user, BadgeKey.THE_SPECIALIST).ifPresent(newlyEarned::add);
        }

        // Degree-related badges may also change when profile updates majors/minors
        newlyEarned.addAll(evaluateDegreeBadges(user));

        return newlyEarned;
    }

    @Transactional
    public List<BadgeKey> evaluateDegreeBadges(User user) {
        List<BadgeKey> newlyEarned = new ArrayList<>();
        List<UserDegreePlan> plans = degreePlanRepo.findByUserId(user.getId());

        // THE_ARCHITECT: has at least one degree plan
        if (!plans.isEmpty()) {
            grantIfNotEarned(user, BadgeKey.THE_ARCHITECT).ifPresent(newlyEarned::add);
        }

        if (plans.isEmpty()) return newlyEarned;

        // Use service to get overall progress
        UserDegreePlanService.DegreeProgressSummary progress =
            degreePlanService.getDegreeProgressForUser(user);
        int completed = progress.getCompletedCredits();
        int required = progress.getRequiredCredits();

        if (required > 0) {
            double ratio = (double) completed / required;

            // HALFWAY_THERE: 50%+ degree completion
            if (ratio >= 0.5) {
                grantIfNotEarned(user, BadgeKey.HALFWAY_THERE).ifPresent(newlyEarned::add);
            }

            // THE_FINISH_LINE: 90%+ degree completion
            if (ratio >= 0.9) {
                grantIfNotEarned(user, BadgeKey.THE_FINISH_LINE).ifPresent(newlyEarned::add);
            }

            // GEN_ED_GLADIATOR: 30+ completed credits (proxy for gen-ed completion)
            if (completed >= 30) {
                grantIfNotEarned(user, BadgeKey.GEN_ED_GLADIATOR).ifPresent(newlyEarned::add);
            }

            // UPPERCLASSMAN_STATUS: 90+ total completed credits
            if (completed >= 90) {
                grantIfNotEarned(user, BadgeKey.UPPERCLASSMAN_STATUS).ifPresent(newlyEarned::add);
            }

            // THE_MARATHONER: 120+ total completed credits
            if (completed >= 120) {
                grantIfNotEarned(user, BadgeKey.THE_MARATHONER).ifPresent(newlyEarned::add);
            }
        }

        // PREREQUISITE_MASTER: completed a course with a 3-deep prerequisite chain
        Set<String> completedIds = user.getCompletedCourseIds();
        if (completedIds != null && !completedIds.isEmpty()) {
            boolean found = completedIds.stream()
                .anyMatch(idStr -> {
                    try {
                        return prerequisiteChainDepth(Integer.parseInt(idStr), new HashSet<>()) >= 3;
                    } catch (NumberFormatException e) {
                        return false;
                    }
                });
            if (found) {
                grantIfNotEarned(user, BadgeKey.PREREQUISITE_MASTER).ifPresent(newlyEarned::add);
            }
        }

        return newlyEarned;
    }

    @Transactional
    public void evaluateAdvisorAppointmentBadge(User user) {
        grantIfNotEarned(user, BadgeKey.ON_THE_BOOKS);
    }

    @Transactional
    public void evaluateAdvisorContactBadge(User student) {
        grantIfNotEarned(student, BadgeKey.ADVISORS_RADAR);
    }

    private int prerequisiteChainDepth(int courseId, Set<Integer> visited) {
        if (visited.contains(courseId)) return 0; // prevent cycles
        visited.add(courseId);
        List<Prerequisite> prereqs = prerequisiteRepo.findByCourseId(courseId);
        if (prereqs.isEmpty()) return 0;
        int maxDepth = 0;
        for (Prerequisite p : prereqs) {
            int d = prerequisiteChainDepth(p.getPrereqCourseId(), new HashSet<>(visited));
            if (d > maxDepth) maxDepth = d;
        }
        return maxDepth + 1;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserBadgesResponse(Long userId) {
        Set<BadgeKey> earned = userBadgeRepo.findByUserId(userId).stream()
            .map(UserBadge::getBadgeKey)
            .collect(Collectors.toSet());

        Map<BadgeKey, LocalDateTime> earnedDates = userBadgeRepo.findByUserId(userId).stream()
            .collect(Collectors.toMap(UserBadge::getBadgeKey, UserBadge::getEarnedDate));

        return CATALOG.stream().map(def -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("key", def.key.name());
            entry.put("name", def.name);
            entry.put("description", def.description);
            entry.put("icon", def.icon);
            entry.put("category", def.category);
            entry.put("earned", earned.contains(def.key));
            if (earned.contains(def.key) && earnedDates.containsKey(def.key)) {
                entry.put("earnedDate", earnedDates.get(def.key).toString());
            }
            return entry;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPublicBadgesForUser(Long userId) {
        Set<BadgeKey> earned = userBadgeRepo.findByUserId(userId).stream()
            .map(UserBadge::getBadgeKey)
            .collect(Collectors.toSet());

        return CATALOG.stream()
            .filter(def -> earned.contains(def.key))
            .map(def -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("key", def.key.name());
                entry.put("name", def.name);
                entry.put("description", def.description);
                entry.put("icon", def.icon);
                entry.put("category", def.category);
                return entry;
            }).collect(Collectors.toList());
    }

    @Transactional
    public List<Map<String, Object>> drainNotifications(Long userId) {
        List<UserBadge> pending = userBadgeRepo.findPendingByUserId(userId);
        userBadgeRepo.markAllNotified(userId);
        return pending.stream().map(ub -> {
            BadgeDefinition def = CATALOG_MAP.get(ub.getBadgeKey());
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("key", ub.getBadgeKey().name());
            entry.put("name", def != null ? def.name : ub.getBadgeKey().name());
            entry.put("description", def != null ? def.description : "");
            entry.put("icon", def != null ? def.icon : "star-outline");
            entry.put("category", def != null ? def.category : "");
            entry.put("earnedDate", ub.getEarnedDate().toString());
            return entry;
        }).collect(Collectors.toList());
    }

    public int getBadgeCount(Long userId) {
        return userBadgeRepo.findByUserId(userId).size();
    }

    private Optional<BadgeKey> grantIfNotEarned(User user, BadgeKey key) {
        if (!userBadgeRepo.existsByUserIdAndBadgeKey(user.getId(), key)) {
            userBadgeRepo.save(new UserBadge(user, key));
            return Optional.of(key);
        }
        return Optional.empty();
    }

}
