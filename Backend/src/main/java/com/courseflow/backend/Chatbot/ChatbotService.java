package com.courseflow.backend.Chatbot;

import com.courseflow.backend.Caching.CourseCacheService;
import com.courseflow.backend.Courses.Course;
import com.courseflow.backend.SmartScheduler.AcademicPeriodRepository;
import com.courseflow.backend.SmartScheduler.Entity.AcademicPeriod;
import com.courseflow.backend.SmartScheduler.Entity.Section;
import com.courseflow.backend.SmartScheduler.SectionRepository;
import com.courseflow.backend.Users.JwtService;
import com.courseflow.backend.Users.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private RestTemplate restTemplate;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private AcademicPeriodRepository academicPeriodRepository;
    @Autowired private CourseCacheService courseCacheService;
    @Autowired private LLMService llmService;

    // ---------------------------
    // STATE
    // ---------------------------
    private static class State {
        boolean dashboardLoaded = false;
        boolean programConfirmed = false;
        boolean conversationActive = false;

        String programId;
        String degreeType;
        String academicPeriod;

        List<Map<String, Object>> allPlans = new ArrayList<>();
        List<Map<String, Object>> allRemainingCourses = new ArrayList<>();

        Set<String> completedCourseIds = new HashSet<>();
        Set<String> inProgressCourseIds = new HashSet<>();

        int totalCompletedCredits = 0;
        int totalRequiredCredits = 0;
        int totalRemainingCredits = 0;

        List<Map<String, String>> blockedTimes = new ArrayList<>();
        String registrationStatus;
    }

    private final Map<Long, State> userStates = new HashMap<>();

    private State getState(Long userId) {
        return userStates.computeIfAbsent(userId, id -> new State());
    }

    private String extractNetId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId).orElseThrow().getNetid();
    }

    // =====================================================
    // MAIN CHAT FLOW
    // =====================================================
    public ChatResponse processMessage(String authHeader, String academicPeriod, String message) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtService.extractUserId(token);
        State state = getState(userId);

        if (state.academicPeriod == null && academicPeriod != null) {
            state.academicPeriod = academicPeriod;
        }

        if (message.equalsIgnoreCase("/reset") || message.equalsIgnoreCase("start over")) {
            userStates.remove(userId);
            return new ChatResponse("Conversation reset!", "RESET", List.of("Start"));
        }

        // =====================================================
        // STEP 1: DASHBOARD
        // =====================================================
        if (!state.dashboardLoaded) {
            state.dashboardLoaded = true;

            Map response = getDashboard(token);
            Map dashboard = (Map) response.get("data");

            if (dashboard == null) {
                return new ChatResponse("Dashboard failed to load.", "ERROR", List.of());
            }

            state.allPlans = (List<Map<String, Object>>) dashboard.get("declaredPlans");

            if (state.allPlans == null || state.allPlans.isEmpty()) {
                return new ChatResponse("No degree plans found.", "END", List.of());
            }

            Map<String, Object> first = state.allPlans.get(0);
            state.programId = (String) first.get("programId");
            state.degreeType = (String) first.get("degreeType");

            List<String> completed = (List<String>) dashboard.get("completedCourses");
            if (completed != null) state.completedCourseIds = new HashSet<>(completed);

            List<String> inProgress = (List<String>) dashboard.get("inProgressCourses");
            if (inProgress != null) state.inProgressCourseIds = new HashSet<>(inProgress);

            String programText = "Hi! I have your current program as: " +
                    state.programId + " (" + state.degreeType + ")";

            if (state.allPlans.size() > 1) {
                programText += "\n\nYou also have:";
                for (int i = 1; i < state.allPlans.size(); i++) {
                    Map<String, Object> plan = state.allPlans.get(i);
                    programText += "\n• " + plan.get("programId") + " (" + plan.get("degreeType") + ")";
                    Boolean completedPlan = (Boolean) plan.get("completed");
                    if (completedPlan != null && completedPlan) {
                        programText += " ✓ (COMPLETED)";
                    }
                }
            }

            programText += "\n\nIs this correct?";

            return new ChatResponse(programText, "CONFIRM_PROGRAM", List.of("Yes", "No"));
        }

        // =====================================================
        // STEP 2: CONFIRM PROGRAM
        // =====================================================
        if (!state.programConfirmed) {

            if (message.equalsIgnoreCase("No")) {
                return new ChatResponse("Please update your plan first.", "END", List.of());
            }

            state.programConfirmed = true;
            state.conversationActive = true;

            calculateProgressFromDashboard(state);

            return new ChatResponse(
                    generateProgressText(state) + "\n\nWhat scheduling preferences do you have?",
                    "CONVERSATION",
                    List.of("No mornings", "No evenings", "No Fridays", "Full-time", "Part-time", "That's it")
            );
        }

        // =====================================================
        // STEP 3: LLM CONVERSATION
        // =====================================================
        if (state.conversationActive) {

            String currentConstraints;
            try {
                Map<String, Object> c = new HashMap<>();
                c.put("blockedTimes", state.blockedTimes);
                c.put("registrationStatus", state.registrationStatus);
                currentConstraints = objectMapper.writeValueAsString(c);
            } catch (Exception e) {
                currentConstraints = "{}";
            }

            String llmResponse = llmService.extractPreferences(message, currentConstraints);
            JsonNode json;

            try {
                json = objectMapper.readTree(llmResponse);
                if (json == null || !json.isObject()) {
                    throw new RuntimeException("Invalid LLM JSON");
                }
            } catch (Exception e) {
                return new ChatResponse(
                        "I didn't understand that. Try rephrasing.",
                        "CONVERSATION",
                        List.of("No mornings", "No evenings", "No Fridays", "Full-time", "Part-time", "That's it")
                );
            }

            boolean hasUpdates = false;

            // Blocked times
            if (json.has("blockedTimes") && json.get("blockedTimes").isArray()) {
                for (JsonNode bt : json.get("blockedTimes")) {
                    Map<String, String> blocked = new HashMap<>();
                    blocked.put("day", bt.path("day").asText());
                    blocked.put("start", bt.path("start").asText());
                    blocked.put("end", bt.path("end").asText());

                    if (!state.blockedTimes.contains(blocked)) {
                        state.blockedTimes.add(blocked);
                    }
                    hasUpdates = true;
                }
            }

            // Registration status
            JsonNode reg = json.get("registrationStatus");
            if (reg != null && !reg.isNull()) {
                state.registrationStatus = reg.asText();
                hasUpdates = true;
            }

            // Check if done
            if (json.path("isComplete").asBoolean(false)) {
                state.conversationActive = false;
                loadAllAudits(token, state);
                calculateRemainingCredits(state);
                return generateCoursePayload(token, state);
            }

            return new ChatResponse(
                    hasUpdates ? "Got it. Anything else?" : "Can you rephrase?",
                    "CONVERSATION",
                    List.of("No mornings", "No evenings", "No Fridays", "Full-time", "Part-time", "That's it")
            );
        }

        return generateCoursePayload(token, state);
    }

    // =====================================================
    // PROGRESS CALCULATIONS
    // =====================================================

    private void calculateProgressFromDashboard(State state) {
        int completed = 0;
        int required = 0;

        for (Map<String, Object> plan : state.allPlans) {
            Integer c = (Integer) plan.get("completedCredits");
            Integer r = (Integer) plan.get("requiredCredits");

            if (c != null) completed += c;
            if (r != null) required += r;
        }

        state.totalCompletedCredits = completed;
        state.totalRequiredCredits = required;
        state.totalRemainingCredits = required - completed;
    }

    private String generateProgressText(State state) {
        String level = getAcademicLevel(state.totalCompletedCredits);
        int percentComplete = state.totalRequiredCredits > 0 ?
                (state.totalCompletedCredits * 100 / state.totalRequiredCredits) : 0;

        StringBuilder text = new StringBuilder();
        text.append("📊 **Your Progress Summary**\n\n");

        for (Map<String, Object> plan : state.allPlans) {
            String programId = (String) plan.get("programId");
            String degreeType = (String) plan.get("degreeType");
            Integer completed = (Integer) plan.get("completedCredits");
            Integer required = (Integer) plan.get("requiredCredits");
            Boolean isCompleted = (Boolean) plan.get("completed");

            text.append("• ").append(programId).append(" (").append(degreeType).append("): ");
            if (isCompleted != null && isCompleted) {
                text.append("✓ COMPLETED! (").append(completed).append("/").append(required).append(" credits)\n");
            } else {
                text.append(completed).append("/").append(required).append(" credits completed\n");
            }
        }

        text.append("\n**Overall:**\n");
        text.append("• Level: ").append(level).append("\n");
        text.append("• Progress: ").append(percentComplete).append("% complete\n");
        text.append("• Remaining Credits: ").append(state.totalRemainingCredits).append("\n");
        text.append("• Estimated Time: ").append(getEstimatedTime(state.totalRemainingCredits)).append("\n");

        return text.toString();
    }

    private void calculateRemainingCredits(State state) {
        int totalRemaining = 0;
        for (Map<String, Object> course : state.allRemainingCourses) {
            Object creditsObj = course.get("credits");
            if (creditsObj == null) continue;

            int credits = 0;
            if (creditsObj instanceof Integer) {
                credits = (Integer) creditsObj;
            } else if (creditsObj instanceof String) {
                credits = parseCredits((String) creditsObj);
            } else if (creditsObj instanceof Double) {
                credits = ((Double) creditsObj).intValue();
            }
            totalRemaining += credits;
        }
        state.totalRemainingCredits = totalRemaining;
    }

    // =====================================================
    // AUDIT & COURSE LOADING
    // =====================================================

    private void loadAllAudits(String token, State state) {
        state.allRemainingCourses.clear();

        for (Map<String, Object> plan : state.allPlans) {
            String programId = (String) plan.get("programId");

            Boolean completed = (Boolean) plan.get("completed");
            if (completed != null && completed) {
                System.out.println("Skipping completed program: " + programId);
                continue;
            }

            Map response = getAudit(token, programId);
            List<Map<String, Object>> categories = (List<Map<String, Object>>) response.get("data");

            if (categories != null) {
                for (Map<String, Object> category : categories) {
                    List<Map<String, Object>> remaining = (List<Map<String, Object>>) category.get("remainingOptions");

                    if (remaining != null && !remaining.isEmpty()) {
                        for (Map<String, Object> course : remaining) {
                            String courseNumber = (String) course.get("courseNumber");

                            if (!state.completedCourseIds.contains(courseNumber) &&
                                    !state.inProgressCourseIds.contains(courseNumber)) {

                                // OPTIMIZED: Uses cached prerequisite checking now
                                if (canTakeCourse(courseNumber, state.completedCourseIds)) {
                                    state.allRemainingCourses.add(course);
                                }
                            }
                        }
                    }
                }
            }
        }

        System.out.println("Courses loaded from audits: " + state.allRemainingCourses.size());
    }

    private boolean canTakeCourse(String courseNumber, Set<String> completedCourses) {
        Optional<Course> courseOpt = courseCacheService.findByCourseNum(courseNumber);
        if (courseOpt.isEmpty()) return true;

        Integer courseId = courseOpt.get().getId();

        if (!courseCacheService.existsByCourseId(courseId)) return true;

        List<Prerequisite> prerequisites = courseCacheService.findByCourseId(courseId);
        if (prerequisites.isEmpty()) return true;

        Map<Integer, List<Integer>> groups = new HashMap<>();
        for (Prerequisite prereq : prerequisites) {
            groups.computeIfAbsent(prereq.getLogicGroupId(), k -> new ArrayList<>())
                    .add(prereq.getPrereqCourseId());
        }

        for (List<Integer> groupPrereqs : groups.values()) {
            boolean satisfied = false;
            for (Integer prereqId : groupPrereqs) {
                // Querying from Cache Service
                Optional<Course> prereqCourse = courseCacheService.findById(prereqId);
                if (prereqCourse.isPresent()) {
                    String prereqNumber = prereqCourse.get().getcourseNum(); // make sure casing here matches your Course entity
                    if (completedCourses.contains(prereqNumber)) {
                        satisfied = true;
                        break;
                    }
                }
            }
            if (!satisfied) return false;
        }
        return true;
    }

    // =====================================================
    // PAYLOAD GENERATION
    // =====================================================

    private ChatResponse generateCoursePayload(String token, State state) {
        try {

            Integer academicPeriodId = resolveAcademicPeriodId(state.academicPeriod);
            if (academicPeriodId == null) {
                return new ChatResponse("Academic period not found.", "ERROR", List.of("Start Over"));
            }

            List<String> remainingCourseNumbers = state.allRemainingCourses.stream()
                    .map(c -> (String) c.get("courseNumber"))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            // ONE Database Query for all sections, using extracted course numbers and the academic period that was extracted once above
            List<Section> allSections = new ArrayList<>();
            if (!remainingCourseNumbers.isEmpty()) {
                allSections = sectionRepository.findByCourseNumberInAndAcademicPeriodId(
                        remainingCourseNumbers, academicPeriodId
                );
            }

            // Mapped by CourseNum in mem
            Map<String, List<Section>> sectionsByCourse = allSections.stream()
                    .collect(Collectors.groupingBy(s -> s.getCourse().getcourseNum()));

            List<Map<String, Object>> coursesList = new ArrayList<>();

            // 5. Build payload entirely in memory
            for (Map<String, Object> course : state.allRemainingCourses) {
                String courseNumber = (String) course.get("courseNumber");
                String courseTitle = (String) course.get("courseTitle");
                String credits = (String) course.get("credits");

                // Pull from our memory map instantly
                List<Section> sections = sectionsByCourse.getOrDefault(courseNumber, Collections.emptyList());

                List<Map<String, Object>> sectionList = new ArrayList<>();
                for (Section section : sections) {
                    List<Map<String, String>> meetings = parseMeetingPatternsForPayload(section.getMeetingPatterns());

                    if (hasConflictWithBlockedTimes(meetings, state.blockedTimes)) {
                        continue;
                    }

                    String instructor = "TBA";
                    if (section.getSectionProfessors() != null && !section.getSectionProfessors().isEmpty()) {
                        instructor = section.getSectionProfessors().get(0).getName();
                    }

                    Map<String, Object> sectionMap = new HashMap<>();
                    sectionMap.put("id", section.getSectionId());
                    sectionMap.put("sectionNum", section.getSectionNumber());
                    sectionMap.put("instructor", instructor);
                    sectionMap.put("capacity", section.getOpenSeats() != null ? section.getOpenSeats() : 0);
                    sectionMap.put("meetings", meetings);
                    sectionList.add(sectionMap);
                }

                if (!sectionList.isEmpty()) {
                    Map<String, Object> courseMap = new HashMap<>();
                    courseMap.put("code", courseNumber);
                    courseMap.put("name", courseTitle != null ? courseTitle : courseNumber);
                    courseMap.put("credits", credits);
                    courseMap.put("sections", sectionList);
                    coursesList.add(courseMap);
                }
            }

            int targetCredits = getTargetCredits(state);

            Map<String, Object> payload = new HashMap<>();
            payload.put("academicPeriod", state.academicPeriod);
            payload.put("registrationStatus", state.registrationStatus != null ? state.registrationStatus : "Full-time");
            payload.put("targetCredits", targetCredits);
            payload.put("courses", coursesList);
            payload.put("blockedTimes", state.blockedTimes);

            if (coursesList.isEmpty()) {
                return new ChatResponse(
                        "No remaining courses found for your degree program(s) that fit your schedule.",
                        "COMPLETE",
                        List.of("Start Over"),
                        payload
                );
            }

            return new ChatResponse(
                    "Your course options are ready! 🎓\n\n" +
                            "Please use the 'Generate Schedule' button above to create your schedule based on your preferences.\n\n" +
                            "If it's not what you're wanting, come back and chat again!",
                    "COMPLETE",
                    List.of("Reset"),
                    payload
            );

        } catch (Exception e) {
            e.printStackTrace();
            return new ChatResponse(
                    "Sorry, I couldn't load your courses: " + e.getMessage(),
                    "ERROR",
                    List.of("Try again")
            );
        }
    }

    private int getTargetCredits(State state) {
        if ("Part-time".equals(state.registrationStatus)) {
            return 9;
        }
        return 12;
    }

    // =====================================================
    // TIME CONFLICT CHECKING
    // =====================================================

    private boolean hasConflictWithBlockedTimes(List<Map<String, String>> meetings, List<Map<String, String>> blockedTimes) {
        if (blockedTimes == null || blockedTimes.isEmpty()) {
            return false;
        }

        for (Map<String, String> meeting : meetings) {
            String meetingDay = meeting.get("day");
            String meetingStart = meeting.get("start");
            String meetingEnd = meeting.get("end");

            LocalTime meetingStartTime = parseTimeString(meetingStart);
            LocalTime meetingEndTime = parseTimeString(meetingEnd);

            for (Map<String, String> blocked : blockedTimes) {
                String blockedDay = blocked.get("day");
                String blockedStart = blocked.get("start");
                String blockedEnd = blocked.get("end");

                if (meetingDay.equals(blockedDay)) {
                    LocalTime blockedStartTime = LocalTime.parse(blockedStart);
                    LocalTime blockedEndTime = LocalTime.parse(blockedEnd);

                    if (meetingStartTime.isBefore(blockedEndTime) && meetingEndTime.isAfter(blockedStartTime)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private LocalTime parseTimeString(String timeStr) {
        if (timeStr == null) return LocalTime.MIDNIGHT;

        try {
            return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("h:mm a"));
        } catch (Exception e) {
            try {
                return LocalTime.parse(timeStr);
            } catch (Exception ex) {
                return LocalTime.MIDNIGHT;
            }
        }
    }

    // =====================================================
    // MEETING PATTERN PARSING
    // =====================================================

    private List<Map<String, String>> parseMeetingPatternsForPayload(String pattern) {
        List<Map<String, String>> meetings = new ArrayList<>();
        if (pattern == null || pattern.trim().isEmpty()) return meetings;

        String[] patterns = pattern.split(";");
        for (String p : patterns) {
            p = p.trim();
            if (p.isEmpty()) continue;
            String[] parts = p.split("\\|");
            if (parts.length != 2) continue;
            String daysPart = parts[0].trim();
            String timePart = parts[1].trim();
            String[] timeRange = timePart.split("-");
            if (timeRange.length != 2) continue;

            for (char c : daysPart.toCharArray()) {
                String day = convertDayCharToName(c);
                if (day != null) {
                    Map<String, String> meeting = new HashMap<>();
                    meeting.put("day", day);
                    meeting.put("start", timeRange[0].trim());
                    meeting.put("end", timeRange[1].trim());
                    meetings.add(meeting);
                }
            }
        }
        return meetings;
    }

    private String convertDayCharToName(char c) {
        switch (c) {
            case 'M': return "Mon";
            case 'T': return "Tue";
            case 'W': return "Wed";
            case 'R': return "Thu";
            case 'F': return "Fri";
            default: return null;
        }
    }

    // =====================================================
    // ACADEMIC PERIOD
    // =====================================================

    private Integer resolveAcademicPeriodId(String academicPeriodName) {
        Optional<AcademicPeriod> period = academicPeriodRepository.findByName(academicPeriodName);
        return period.map(AcademicPeriod::getAcademicPeriodId).orElse(null);
    }

    // =====================================================
    // UTILITY METHODS
    // =====================================================

    private String getAcademicLevel(int credits) {
        if (credits < 30) return "Freshman";
        if (credits < 60) return "Sophomore";
        if (credits < 90) return "Junior";
        return "Senior";
    }

    private String getEstimatedTime(int remainingCredits) {
        int years = (int) Math.round(remainingCredits / 30.0);
        if (years <= 0) return "Less than 1 year";
        if (years == 1) return "1 year";
        return years + " years";
    }

    private int parseCredits(String credits) {
        if (credits == null || credits.isEmpty() || credits.equals("?")) return 0;
        try {
            if (credits.contains("-")) {
                return Integer.parseInt(credits.split("-")[0].trim());
            }
            return (int) Double.parseDouble(credits.trim());
        } catch (Exception e) {
            return 0;
        }
    }

    // =====================================================
    // API CALLS
    // =====================================================

    private Map getDashboard(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "http://localhost:8080/api/user/dashboard",
                HttpMethod.GET,
                entity,
                Map.class
        );

        return response.getBody();
    }

    private Map getAudit(String token, String programId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "http://localhost:8080/api/user/plans/" + programId + "/audit",
                HttpMethod.GET,
                entity,
                Map.class
        );

        return response.getBody();
    }
}