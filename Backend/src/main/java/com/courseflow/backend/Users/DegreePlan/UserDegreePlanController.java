package com.courseflow.backend.Users.DegreePlan;

import com.courseflow.backend.DegreePrograms.DegreeProgram;
import com.courseflow.backend.DegreePrograms.DegreeProgramRepository;
import com.courseflow.backend.DegreePrograms.RequirementDetailsDTO;
import com.courseflow.backend.DegreePrograms.RequirementRules;
import com.courseflow.backend.DegreePrograms.DegreeProgramService;
import com.courseflow.backend.Users.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserDegreePlanController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDegreePlanRepository planRepository;

    @Autowired
    private DegreeProgramRepository degreeProgramRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private DegreeProgramService degreeService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserDegreePlanService userDegreePlanService;

    @PostMapping("/plans/create")
    public ResponseEntity<ApiResponse> createPlan(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreatePlanRequest request) {
        try {
            Long userId = extractUserId(authHeader);
            User user = userRepository.findById(userId).orElseThrow();

            // Fetch the actual DegreeProgram object
            DegreeProgram program = degreeProgramRepository.findById(request.getProgramId())
                    .orElseThrow(() -> new RuntimeException("Degree program not found."));

            Optional<UserDegreePlan> existing = planRepository.findByUserIdAndDegreeProgram_ProgramId(userId, request.getProgramId());
            if (existing.isPresent()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Plan already exists for this program"));
            }

            // Pass the object, not the string
            UserDegreePlan newPlan = new UserDegreePlan(user, program, request.getDegreeType());
            planRepository.save(newPlan);

            return ResponseEntity.ok(new ApiResponse(true, "Degree plan created", newPlan));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, e.getMessage()));
        }
    }

    // --------------------------------------------------------
    // 2. UPDATE COURSES (Completed & In-Progress)
    // --------------------------------------------------------
    @PostMapping("/courses")
    public ResponseEntity<ApiResponse> updateUserCourses(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateCoursesRequest request) {
        try {
            Long userId = extractUserId(authHeader);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User ID from token not found in database"));

            // --- Handle Completed Courses ---
            Set<String> completedIdsToSave = new HashSet<>();
            if (request.getCourseNumbers() != null && !request.getCourseNumbers().isEmpty()) {
                String inSql = String.join(",", Collections.nCopies(request.getCourseNumbers().size(), "?"));
                String sql = String.format("SELECT course_id FROM courses WHERE course_number IN (%s)", inSql);

                List<String> foundIds = jdbcTemplate.query(
                        sql,
                        (rs, rowNum) -> rs.getString("course_id"),
                        request.getCourseNumbers().toArray()
                );
                System.out.println("DEBUG: Found " + foundIds.size() + " completed courses in DB.");
                completedIdsToSave.addAll(foundIds);
            }
            user.setCompletedCourseIds(completedIdsToSave);

            // --- Handle In-Progress Courses ---
            Set<String> inProgressIdsToSave = new HashSet<>();
            if (request.getInProgressCourseNumbers() != null && !request.getInProgressCourseNumbers().isEmpty()) {
                String inSql = String.join(",", Collections.nCopies(request.getInProgressCourseNumbers().size(), "?"));
                String sql = String.format("SELECT course_id FROM courses WHERE course_number IN (%s)", inSql);

                List<String> foundIds = jdbcTemplate.query(
                        sql,
                        (rs, rowNum) -> rs.getString("course_id"),
                        request.getInProgressCourseNumbers().toArray()
                );
                inProgressIdsToSave.addAll(foundIds);
            }
            user.setInProgressCourseIds(inProgressIdsToSave);

            userRepository.save(user);

            return ResponseEntity.ok(new ApiResponse(true, "Transcript updated successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, e.getMessage()));
        }
    }

    // --------------------------------------------------------
    // 3. GET USER DASHBOARD
    // --------------------------------------------------------
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse> getUserDashboard(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            User user = userRepository.findById(userId).orElseThrow();
            List<UserDegreePlan> plans = planRepository.findByUserId(userId);

            Set<String> completedIds = user.getCompletedCourseIds();
            Set<String> inProgressIds = user.getInProgressCourseIds();

            Map<String, Object> dashboard = new HashMap<>();

            List<Map<String, Object>> planList = new ArrayList<>();
            for (UserDegreePlan plan : plans) {
                Map<String, Object> p = new LinkedHashMap<>();

                String actualProgramId = plan.getDegreeProgram().getProgramId();

                p.put("id", plan.getId());
                p.put("programId", actualProgramId);
                p.put("programName", plan.getDegreeProgram().getName());
                p.put("degreeType", plan.getDegreeType());

                List<RequirementRules> rules = degreeService.getDegreeManifest(actualProgramId);
                Map<String, List<RequirementDetailsDTO>> structuredDegree = degreeService.getStructuredDegree(actualProgramId);

                int totalRequiredCredits = 0;
                int totalCompletedCredits = 0;

                for (RequirementRules rule : rules) {
                    String catName = rule.getCategoryName().name();
                    String ruleGroupId = rule.getGroupId() != null ? rule.getGroupId().name() : "NONE";

                    int ruleRequired = rule.getRequiredCredits();
                    boolean isCheckboxRule = catName.equals("INTERNATIONAL_PERSPECTIVES") ||
                            catName.equals("US_CULTURES_AND_COMMUNITIES") ||
                            catName.equals("COMMUNICATION_PROFICIENCY");

                    if (!isCheckboxRule) {
                        totalRequiredCredits += ruleRequired;
                    }

                    List<RequirementDetailsDTO> allReqs = structuredDegree.getOrDefault(catName, new ArrayList<>());
                    int ruleCompleted = 0;

                    for (RequirementDetailsDTO req : allReqs) {
                        String reqGroupId = req.getGroupId() != null ? req.getGroupId() : "NONE";
                        if (!reqGroupId.equals(ruleGroupId)) {
                            continue;
                        }

                        // We only count fully completed courses towards formal credit progress
                        if (completedIds.contains(req.getCourseId())) {
                            ruleCompleted += parseCredits(req.getCredits());
                        }
                    }

                    if (!isCheckboxRule) {
                        totalCompletedCredits += Math.min(ruleCompleted, ruleRequired);
                    }
                }

                p.put("completedCredits", totalCompletedCredits);
                p.put("requiredCredits", totalRequiredCredits);
                p.put("completed", totalCompletedCredits >= totalRequiredCredits && totalRequiredCredits > 0);

                planList.add(p);
            }
            dashboard.put("declaredPlans", planList);

            // Format Completed Courses
            List<String> completedCourseNumbers = new ArrayList<>();
            if (completedIds != null && !completedIds.isEmpty()) {
                List<Integer> idList = completedIds.stream().map(Integer::parseInt).collect(Collectors.toList());
                String inSql = String.join(",", Collections.nCopies(idList.size(), "?"));
                String sql = String.format("SELECT course_number FROM courses WHERE course_id IN (%s)", inSql);
                completedCourseNumbers = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("course_number"), idList.toArray());
            }
            dashboard.put("completedCourses", completedCourseNumbers);

            // Format In-Progress Courses
            List<String> inProgressCourseNumbers = new ArrayList<>();
            if (inProgressIds != null && !inProgressIds.isEmpty()) {
                List<Integer> idList = inProgressIds.stream().map(Integer::parseInt).collect(Collectors.toList());
                String inSql = String.join(",", Collections.nCopies(idList.size(), "?"));
                String sql = String.format("SELECT course_number FROM courses WHERE course_id IN (%s)", inSql);
                inProgressCourseNumbers = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("course_number"), idList.toArray());
            }
            dashboard.put("inProgressCourses", inProgressCourseNumbers);

            return ResponseEntity.ok(new ApiResponse(true, "Fetched dashboard", dashboard));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse(false, e.getMessage()));
        }
    }

    // --------------------------------------------------------
    // 4. GET DEGREE AUDIT
    // --------------------------------------------------------
    @GetMapping("/plans/{programId}/audit")
    public ResponseEntity<ApiResponse> getDegreeAudit(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String programId) {
        try {
            Long userId = extractUserId(authHeader);
            User user = userRepository.findById(userId).orElseThrow();

            // 1. Fetch the user's declared plan from the database
            UserDegreePlan declaredPlan = planRepository.findByUserIdAndDegreeProgram_ProgramId(userId, programId)
                    .orElseThrow(() -> new RuntimeException("You have not declared this degree plan yet."));

            Set<String> completedIds = user.getCompletedCourseIds();
            Set<String> inProgressIds = user.getInProgressCourseIds();

            String actualProgramId = declaredPlan.getDegreeProgram().getProgramId();

            // Pass the guaranteed valid ID to the service
            List<RequirementRules> rules = degreeService.getDegreeManifest(actualProgramId);
            Map<String, List<RequirementDetailsDTO>> structuredDegree = degreeService.getStructuredDegree(actualProgramId);

            List<Map<String, Object>> auditReport = new ArrayList<>();

            for (RequirementRules rule : rules) {
                Map<String, Object> categoryAudit = new LinkedHashMap<>();
                String catName = rule.getCategoryName().name();

                String ruleGroupId = rule.getGroupId() != null ? rule.getGroupId().name() : "NONE";

                categoryAudit.put("categoryName", catName);
                categoryAudit.put("groupId", ruleGroupId);
                categoryAudit.put("requiredCredits", rule.getRequiredCredits());

                List<RequirementDetailsDTO> allReqs = structuredDegree.getOrDefault(catName, new ArrayList<>());

                List<RequirementDetailsDTO> completedCourses = new ArrayList<>();
                List<RequirementDetailsDTO> inProgressCourses = new ArrayList<>();
                List<RequirementDetailsDTO> remainingOptions = new ArrayList<>();

                int completedCredits = 0;

                for (RequirementDetailsDTO req : allReqs) {
                    String reqGroupId = req.getGroupId() != null ? req.getGroupId() : "NONE";
                    if (!reqGroupId.equals(ruleGroupId)) {
                        continue;
                    }

                    req.setOfferedSections(null);

                    // Sort the course into the correct bucket
                    if (completedIds != null && completedIds.contains(req.getCourseId())) {
                        completedCourses.add(req);
                        completedCredits += parseCredits(req.getCredits());
                    } else if (inProgressIds != null && inProgressIds.contains(req.getCourseId())) {
                        inProgressCourses.add(req);
                    } else {
                        remainingOptions.add(req);
                    }
                }

                categoryAudit.put("completedCredits", completedCredits);
                categoryAudit.put("isFulfilled", completedCredits >= rule.getRequiredCredits());
                categoryAudit.put("completedCourses", completedCourses);
                categoryAudit.put("inProgressCourses", inProgressCourses);
                categoryAudit.put("remainingOptions", remainingOptions);

                auditReport.add(categoryAudit);
            }

            return ResponseEntity.ok(new ApiResponse(true, "Degree audit generated", auditReport));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/plans/{programId}")
    public ResponseEntity<ApiResponse> deletePlan(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String programId) {
        try {
            Long userId = extractUserId(authHeader);

            Optional<UserDegreePlan> planOpt = planRepository.findByUserIdAndDegreeProgram_ProgramId(userId, programId);

            if (planOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Plan not found for this program."));
            }

            planRepository.delete(planOpt.get());
            return ResponseEntity.ok(new ApiResponse(true, "Degree plan deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Could not delete plan: " + e.getMessage()));
        }
    }

    private int parseCredits(String credits) {
        if (credits == null || credits.isEmpty() || credits.equals("?")) return 0;
        try {
            String[] parts = credits.split("-");
            return Integer.parseInt(parts[0].trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private Long extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.replace("Bearer ", ""));
    }

    public String extractNetId(String authHeader) {
        return userRepository.findById(extractUserId(authHeader))
                .orElseThrow().getNetid();
    }

    // --------------------------------------------------------
    // 6. GET USER COURSES with full details (code, name, credits)
    // --------------------------------------------------------
    @GetMapping("/courses/details")
    public ResponseEntity<ApiResponse> getUserCoursesWithDetails(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            User user = userRepository.findById(userId).orElseThrow();

            Set<String> completedIds = user.getCompletedCourseIds();
            Set<String> inProgressIds = user.getInProgressCourseIds();

            List<Map<String, Object>> completedDetails = new ArrayList<>();
            if (completedIds != null && !completedIds.isEmpty()) {
                List<Integer> idList = completedIds.stream().map(Integer::parseInt).collect(Collectors.toList());
                String inSql = String.join(",", Collections.nCopies(idList.size(), "?"));
                String sql = String.format(
                    "SELECT course_number, title, credits FROM courses WHERE course_id IN (%s) ORDER BY course_number",
                    inSql);
                completedDetails = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("code", rs.getString("course_number"));
                    m.put("name", rs.getString("title"));
                    m.put("credits", parseCredits(rs.getString("credits")));
                    return m;
                }, idList.toArray());
            }

            List<Map<String, Object>> inProgressDetails = new ArrayList<>();
            if (inProgressIds != null && !inProgressIds.isEmpty()) {
                List<Integer> idList = inProgressIds.stream().map(Integer::parseInt).collect(Collectors.toList());
                String inSql = String.join(",", Collections.nCopies(idList.size(), "?"));
                String sql = String.format(
                    "SELECT course_number, title, credits FROM courses WHERE course_id IN (%s) ORDER BY course_number",
                    inSql);
                inProgressDetails = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("code", rs.getString("course_number"));
                    m.put("name", rs.getString("title"));
                    m.put("credits", parseCredits(rs.getString("credits")));
                    return m;
                }, idList.toArray());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("completedCourses", completedDetails);
            result.put("inProgressCourses", inProgressDetails);

            return ResponseEntity.ok(new ApiResponse(true, "Fetched course details", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Could not fetch course details: " + e.getMessage()));
        }
    }

    // --------------------------------------------------------
    // 7. GET USER COURSES (completed and in progress)
    // --------------------------------------------------------
    @GetMapping("/courses")
    public ResponseEntity<ApiResponse> getUserCourses(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            User user = userRepository.findById(userId).orElseThrow();

            Set<String> completedIds = user.getCompletedCourseIds();
            Set<String> inProgressIds = user.getInProgressCourseIds();

            Map<String, List<String>> transcript = new HashMap<>();

            // 1. Fetch Completed Course Numbers
            List<String> completedCourseNumbers = new ArrayList<>();
            if (completedIds != null && !completedIds.isEmpty()) {
                List<Integer> idList = completedIds.stream().map(Integer::parseInt).collect(Collectors.toList());
                String inSql = String.join(",", Collections.nCopies(idList.size(), "?"));
                String sql = String.format("SELECT course_number FROM courses WHERE course_id IN (%s)", inSql);
                completedCourseNumbers = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("course_number"), idList.toArray());
            }
            transcript.put("completedCourses", completedCourseNumbers);

            // 2. Fetch In-Progress Course Numbers
            List<String> inProgressCourseNumbers = new ArrayList<>();
            if (inProgressIds != null && !inProgressIds.isEmpty()) {
                List<Integer> idList = inProgressIds.stream().map(Integer::parseInt).collect(Collectors.toList());
                String inSql = String.join(",", Collections.nCopies(idList.size(), "?"));
                String sql = String.format("SELECT course_number FROM courses WHERE course_id IN (%s)", inSql);
                inProgressCourseNumbers = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("course_number"), idList.toArray());
            }
            transcript.put("inProgressCourses", inProgressCourseNumbers);

            return ResponseEntity.ok(new ApiResponse(true, "Fetched user transcript", transcript));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Could not fetch courses: " + e.getMessage()));
        }
    }
}