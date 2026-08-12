package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.AccountLevel;
import com.courseflow.backend.Users.JwtService;
import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserRepository;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/advisor")
@CrossOrigin(origins = "*")
public class AdvisorController {

    private final UserRepository userRepo;
    private final AdvisorAdviseeRepository advisorAdviseeRepo;
    private final UserDegreePlanService userDegreePlanService;
    private final JwtService jwtService;

    public AdvisorController(
            UserRepository userRepo,
            AdvisorAdviseeRepository advisorAdviseeRepo,
            UserDegreePlanService userDegreePlanService,
            JwtService jwtService
    ) {
        this.userRepo = userRepo;
        this.advisorAdviseeRepo = advisorAdviseeRepo;
        this.userDegreePlanService = userDegreePlanService;
        this.jwtService = jwtService;
    }

    @GetMapping("/students")
    public List<PublicUser> listStudents() {
        return userRepo.findAll().stream()
                .filter(u -> u.getAccountLevel() == AccountLevel.STUDENT)
                .map(this::toPublicUser)
                .collect(Collectors.toList());
    }

    /** Search students by name or NetID (min 1 character). Returns up to 20 results. */
    @GetMapping("/students/search")
    public List<PublicUser> searchStudents(@RequestParam(defaultValue = "") String query) {
        if (query.isBlank()) return List.of();
        String q = query.toLowerCase();
        return userRepo.findAll().stream()
                .filter(u -> u.getAccountLevel() == AccountLevel.STUDENT)
                .filter(u -> (u.getFullName() != null && u.getFullName().toLowerCase().contains(q))
                          || (u.getNetid() != null && u.getNetid().toLowerCase().contains(q)))
                .limit(20)
                .map(this::toPublicUser)
                .collect(Collectors.toList());
    }

    @GetMapping("/{advisorNetid}/advisees")
    public List<PublicUser> listAdvisees(@PathVariable String advisorNetid) {
        Optional<User> advisorOpt = userRepo.findByNetid(advisorNetid);
        if (advisorOpt.isEmpty()) return List.of();

        return advisorAdviseeRepo.findByAdvisor(advisorOpt.get()).stream()
                .map(AdvisorAdvisee::getStudent)
                .map(this::toPublicUser)
                .collect(Collectors.toList());
    }

    @PostMapping("/{advisorNetid}/advisees")
    public ResponseEntity<String> addAdvisee(
            @PathVariable String advisorNetid,
            @RequestBody(required = false) AddAdviseeRequest req,
            @RequestParam(name = "studentNetid", required = false) String studentNetidParam
    ) {
        String studentNetid = (req != null && req.getStudentNetid() != null && !req.getStudentNetid().isBlank())
                ? req.getStudentNetid()
                : studentNetidParam;

        if (studentNetid == null || studentNetid.isBlank()) {
            return ResponseEntity.badRequest().body("studentNetid is required");
        }

        Optional<User> advisorOpt = userRepo.findByNetid(advisorNetid);
        Optional<User> studentOpt = userRepo.findByNetid(studentNetid);

        if (advisorOpt.isEmpty() || studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Advisor or student not found");
        }

        User advisor = advisorOpt.get();
        User student = studentOpt.get();

        if (advisorAdviseeRepo.existsByAdvisorAndStudent(advisor, student)) {
            return ResponseEntity.status(409).body("Student already added");
        }

        if (!advisorAdviseeRepo.findByStudent(student).isEmpty()) {
            return ResponseEntity.status(409).body("Student already has an advisor assigned");
        }

        advisorAdviseeRepo.save(new AdvisorAdvisee(advisor, student));
        return ResponseEntity.ok("Advisee added");
    }

    /**
     * Returns all students with an isAdvisee flag indicating whether each one
     * is already assigned to the authenticated advisor.
     */
    @GetMapping("/students/browse")
    public ResponseEntity<?> browseStudents(@RequestHeader("Authorization") String authHeader) {
        try {
            Long advisorId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            User advisor = userRepo.findById(advisorId)
                    .orElseThrow(() -> new RuntimeException("Advisor not found"));

            Set<Long> adviseeIds = advisorAdviseeRepo.findByAdvisor(advisor).stream()
                    .map(aa -> aa.getStudent().getId())
                    .collect(Collectors.toSet());

            Map<Long, User> studentToAdvisor = advisorAdviseeRepo.findAll().stream()
                    .collect(Collectors.toMap(
                            aa -> aa.getStudent().getId(),
                            AdvisorAdvisee::getAdvisor,
                            (a, b) -> a));

            List<Map<String, Object>> result = userRepo.findAll().stream()
                    .filter(u -> u.getAccountLevel() == AccountLevel.STUDENT)
                    .map(u -> {
                        UserDegreePlanService.DegreeProgressSummary summary =
                                userDegreePlanService.getDegreeProgressForUser(u);
                        User assignedAdvisor = studentToAdvisor.get(u.getId());
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", u.getId());
                        m.put("netid", u.getNetid());
                        m.put("fullName", u.getFullName());
                        m.put("firstName", u.getFirstName());
                        m.put("lastName", u.getLastName());
                        m.put("email", u.getEmail());
                        m.put("completedCredits", summary.getCompletedCredits());
                        m.put("requiredCredits", summary.getRequiredCredits());
                        m.put("isAdvisee", adviseeIds.contains(u.getId()));
                        m.put("hasAdvisor", assignedAdvisor != null);
                        m.put("advisorName", assignedAdvisor != null ? assignedAdvisor.getFullName() : null);
                        m.put("advisorNetid", assignedAdvisor != null ? assignedAdvisor.getNetid() : null);
                        return m;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to browse students: " + e.getMessage());
        }
    }

    /** Admin view: all students with their assigned advisor info. */
    @GetMapping("/admin/students")
    public ResponseEntity<?> adminBrowseStudents() {
        try {
            Map<Long, User> studentToAdvisor = advisorAdviseeRepo.findAll().stream()
                    .collect(Collectors.toMap(
                            aa -> aa.getStudent().getId(),
                            AdvisorAdvisee::getAdvisor,
                            (a, b) -> a));

            List<Map<String, Object>> result = userRepo.findAll().stream()
                    .filter(u -> u.getAccountLevel() == AccountLevel.STUDENT)
                    .map(u -> {
                        UserDegreePlanService.DegreeProgressSummary summary =
                                userDegreePlanService.getDegreeProgressForUser(u);
                        User assignedAdvisor = studentToAdvisor.get(u.getId());
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", u.getId());
                        m.put("netid", u.getNetid());
                        m.put("fullName", u.getFullName());
                        m.put("firstName", u.getFirstName());
                        m.put("lastName", u.getLastName());
                        m.put("email", u.getEmail());
                        m.put("completedCredits", summary.getCompletedCredits());
                        m.put("requiredCredits", summary.getRequiredCredits());
                        m.put("hasAdvisor", assignedAdvisor != null);
                        m.put("advisorName", assignedAdvisor != null ? assignedAdvisor.getFullName() : null);
                        m.put("advisorNetid", assignedAdvisor != null ? assignedAdvisor.getNetid() : null);
                        return m;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to load students: " + e.getMessage());
        }
    }

    /** Remove a specific student from the authenticated advisor's advisee list. */
    @DeleteMapping("/{advisorNetid}/advisees/{studentNetid}")
    public ResponseEntity<String> removeAdvisee(
            @PathVariable String advisorNetid,
            @PathVariable String studentNetid
    ) {
        Optional<User> advisorOpt = userRepo.findByNetid(advisorNetid);
        Optional<User> studentOpt = userRepo.findByNetid(studentNetid);

        if (advisorOpt.isEmpty() || studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Advisor or student not found");
        }

        User advisor = advisorOpt.get();
        User student = studentOpt.get();

        if (!advisorAdviseeRepo.existsByAdvisorAndStudent(advisor, student)) {
            return ResponseEntity.status(404).body("Advisee relationship not found");
        }

        advisorAdviseeRepo.deleteByAdvisorAndStudent(advisor, student);
        return ResponseEntity.ok("Advisee removed");
    }

    @DeleteMapping("/students/{studentNetid}/advisor")
    public ResponseEntity<String> clearStudentAdvisor(@PathVariable String studentNetid) {
        Optional<User> studentOpt = userRepo.findByNetid(studentNetid);
        if (studentOpt.isEmpty()) return ResponseEntity.notFound().build();

        User student = studentOpt.get();
        if (student.getAccountLevel() != AccountLevel.STUDENT) {
            return ResponseEntity.status(400).body("User is not a student");
        }

        advisorAdviseeRepo.deleteByStudent(student);
        return ResponseEntity.ok("Advisor unassigned");
    }

private PublicUser toPublicUser(User u) {
    UserDegreePlanService.DegreeProgressSummary summary =
            userDegreePlanService.getDegreeProgressForUser(u);

    System.out.println("ADVSEE DEBUG -> netid=" + u.getNetid()
            + ", userId=" + u.getId()
            + ", completedCredits=" + summary.getCompletedCredits()
            + ", requiredCredits=" + summary.getRequiredCredits()
            + ", completedCourseIds=" + u.getCompletedCourseIds());

    return new PublicUser(
            u.getId(),
            u.getGoogleId(),
            u.getEmail(),
            u.getNetid(),
            u.getFullName(),
            u.getFirstName(),
            u.getLastName(),
            summary.getCompletedCredits(),
            summary.getRequiredCredits()
    );
}

    public static class PublicUser {
        private final Long id;
        private final String googleId;
        private final String email;
        private final String netid;
        private final String fullName;
        private final String firstName;
        private final String lastName;
        private final int completedCredits;
        private final int requiredCredits;

        public PublicUser(
                Long id,
                String googleId,
                String email,
                String netid,
                String fullName,
                String firstName,
                String lastName,
                int completedCredits,
                int requiredCredits
        ) {
            this.id = id;
            this.googleId = googleId;
            this.email = email;
            this.netid = netid;
            this.fullName = fullName;
            this.firstName = firstName;
            this.lastName = lastName;
            this.completedCredits = completedCredits;
            this.requiredCredits = requiredCredits;
        }

        public Long getId() { return id; }
        public String getGoogleId() { return googleId; }
        public String getEmail() { return email; }
        public String getNetid() { return netid; }
        public String getFullName() { return fullName; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public int getCompletedCredits() { return completedCredits; }
        public int getRequiredCredits() { return requiredCredits; }
    }

    public static class AddAdviseeRequest {
        private String studentNetid;

        public AddAdviseeRequest() {}

        public String getStudentNetid() { return studentNetid; }
        public void setStudentNetid(String studentNetid) { this.studentNetid = studentNetid; }
    }
}