package com.courseflow.backend.CoursePlan;

import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserRepository;
import com.courseflow.backend.Courses.Course;
import com.courseflow.backend.Courses.CourseRepository;
import com.courseflow.backend.CoursePlan.CoursePlanRepository;
import com.courseflow.backend.CoursePlan.CoursePlan;
import com.courseflow.backend.DegreePrograms.ProgramRequirements;
import com.courseflow.backend.DegreePrograms.ProgramRequirementsRepository;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlan;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlanRepository;
import com.courseflow.backend.Chatbot.Prerequisite;
import com.courseflow.backend.Chatbot.PrerequisiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;

import javax.swing.text.html.Option;

@RestController
@RequestMapping(path = "/api/coursePlan")
public class CoursePlanController {
    @Autowired
    private CoursePlanRepository planRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private CourseRepository courseRepo;

    @Autowired
    private AcademicPeriodsRepository periodRepo;

    @Autowired
    private ProgramRequirementsRepository programRequirementsRepo;

    @Autowired
    private UserDegreePlanRepository userDegreePlanRepo;

    @Autowired
    private PrerequisiteRepository prerequisiteRepo;

    // POST MAPPINGS:
    @PostMapping("/{userId}/addPlan")
    public ResponseEntity<CoursePlanDTO> addCoursePlan(@PathVariable String userId,
            @RequestBody CoursePlanDTO planDto) {
        Optional<User> userOpt = userRepo.findByNetid(userId);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();

        // Map DTO to Entity
        CoursePlan planEntity = new CoursePlan();
        planEntity.setPlanName(planDto.getPlanName());
        planEntity.setTotal_credits(planDto.getTotal_credits());
        planEntity.setUser(userOpt.get());

        for (CourseDTO cDto : planDto.getList_of_courses()) {
            Optional<Course> courseOpt = courseRepo.findByCourseNum(cDto.getCode());
            Optional<AcademicPeriods> periodOpt = periodRepo.findByNameContaining(cDto.getSemester());

            if (courseOpt.isPresent() && periodOpt.isPresent()) {
                PlanCourse pc = new PlanCourse();
                pc.setYear(cDto.getYear());
                pc.setAcademicPeriod(periodOpt.get());
                pc.setTaken(cDto.isTaken());
                pc.setCourse(courseOpt.get());
                pc.setCoursePlan(planEntity);
                planEntity.getPlanCourses().add(pc);
            }
        }

        // Save
        CoursePlan savedPlan = planRepo.save(planEntity);

        // return JSON format
        CoursePlanDTO response = mapToDTO(savedPlan);
        return ResponseEntity.ok(response);
    }

    // //TODO: Create a PUT mapping to add a single class to the courseplan
    // @PutMapping("/{userId}/{planId}/addCourse")
    // public ResponseEntity<CoursePlan> removeSingleCourse(@PathVariable String
    // userId, @PathVariable int planId, @RequestParam String courseCode){
    // //find user
    //
    // //find user's requested plan by plan id
    //
    //
    // }
    /**
     * Get all plans for a specific user, returning the requested nested JSON
     * format.
     */

    @PutMapping("/{planId}/addCourse")
    public ResponseEntity<CoursePlanDTO> addSingleCourse(@PathVariable int planId, @RequestBody CourseDTO cDto) {
        Optional<CoursePlan> planOpt = planRepo.findById(planId);
        if (planOpt.isEmpty())
            return ResponseEntity.notFound().build();

        CoursePlan plan = planOpt.get();

        // 1. Find the actual Course and AcademicPeriod entities
        Optional<Course> courseOpt = courseRepo.findByCourseNum(cDto.getCode());
        Optional<AcademicPeriods> periodOpt = periodRepo.findByNameContaining(cDto.getSemester());

        if (courseOpt.isPresent() && periodOpt.isPresent()) {
            // 2. Create the link (Join Table Entity)
            PlanCourse pc = new PlanCourse();
            pc.setYear(cDto.getYear());
            pc.setAcademicPeriod(periodOpt.get());
            pc.setTaken(cDto.isTaken());
            pc.setCourse(courseOpt.get());
            pc.setCoursePlan(plan);
            // Auto-detect which of the student's declared programs require this course
            User planUser = plan.getUser();
            if (planUser != null) {
                List<UserDegreePlan> userPlans = userDegreePlanRepo.findByUserId(planUser.getId());
                if (!userPlans.isEmpty()) {
                    List<String> programIds = userPlans.stream()
                        .map(up -> up.getDegreeProgram().getProgramId())
                        .collect(Collectors.toList());
                    List<ProgramRequirements> matching = programRequirementsRepo
                        .findByCourseIdAndProgramIdIn(courseOpt.get().getId(), programIds);
                    if (!matching.isEmpty()) {
                        String autoLabel = matching.stream()
                            .map(req -> userPlans.stream()
                                .filter(up -> up.getDegreeProgram().getProgramId().equals(req.getProgramId()))
                                .findFirst()
                                .map(up -> req.getProgramId() + " (" + up.getDegreeType().name() + ")")
                                .orElse(req.getProgramId()))
                            .distinct()
                            .collect(Collectors.joining(","));
                        pc.setProgramLabel(autoLabel);
                    }
                }
            }

            // 3. Update Plan totals and add to list
            plan.getPlanCourses().add(pc);
            int newCredits = Integer.parseInt(courseOpt.get().getCredits());
            plan.setTotal_credits(plan.getTotal_credits() + newCredits);

            // 4. Save and return the updated DTO
            CoursePlan savedPlan = planRepo.save(plan);
            return ResponseEntity.ok(mapToDTO(savedPlan));
        }

        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/{userId}/plans")
    public ResponseEntity<List<CoursePlanDTO>> getUserPlans(@PathVariable String userId) {
        Optional<User> userOpt = userRepo.findByNetid(userId);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();

        List<CoursePlan> plans = planRepo.findByUser(userOpt.get());
        List<CoursePlanDTO> dtos = plans.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Remove a course from a plan and update the total credits.
     */
    // made this change because credits on removal are not being updated correctly
    @PutMapping("/{planId}/removeCourse")
    public ResponseEntity<CoursePlanDTO> removeCourse(@PathVariable int planId, @RequestParam String courseCode) {
        Optional<CoursePlan> planOpt = planRepo.findById(planId);

        if (planOpt.isPresent()) {
            CoursePlan plan = planOpt.get();
            Optional<PlanCourse> pcToRemove = plan.getPlanCourses().stream()
                    .filter(pc -> pc.getCourse().getcourseNum().equals(courseCode))
                    .findFirst();

            if (pcToRemove.isPresent()) {
                // 1. Remove the course link (orphanRemoval handles the DB delete)
                plan.getPlanCourses().remove(pcToRemove.get());

                // 2. Recalculate total credits from the remaining courses
                int newTotal = plan.getPlanCourses().stream()
                        .mapToInt(pc -> Integer.parseInt(pc.getCourse().getCredits()))
                        .sum();

                // 3. Set the new absolute total
                plan.setTotal_credits(newTotal);

                CoursePlan updatedPlan = planRepo.save(plan);
                return ResponseEntity.ok(mapToDTO(updatedPlan));
            }
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Move a course to a different year/semester within the same plan.
     */
    @PutMapping("/{planId}/moveCourse")
    public ResponseEntity<CoursePlanDTO> moveCourse(
            @PathVariable int planId,
            @RequestParam String courseCode,
            @RequestParam int targetYear,
            @RequestParam String targetSemester) {
        Optional<CoursePlan> planOpt = planRepo.findById(planId);
        if (planOpt.isEmpty()) return ResponseEntity.notFound().build();

        CoursePlan plan = planOpt.get();
        Optional<PlanCourse> pcOpt = plan.getPlanCourses().stream()
                .filter(pc -> pc.getCourse().getcourseNum().equals(courseCode))
                .findFirst();
        if (pcOpt.isEmpty()) return ResponseEntity.notFound().build();

        Optional<AcademicPeriods> periodOpt = periodRepo.findByNameContaining(targetSemester);
        if (periodOpt.isEmpty()) return ResponseEntity.badRequest().build();

        PlanCourse pc = pcOpt.get();
        pc.setYear(targetYear);
        pc.setAcademicPeriod(periodOpt.get());

        CoursePlan saved = planRepo.save(plan);
        return ResponseEntity.ok(mapToDTO(saved));
    }

    /**
     * Delete a plan and all its associated courses (handled by CascadeType.ALL).
     */
    @DeleteMapping("/{planId}/delete")
    public String deletePlan(@PathVariable int planId) {
        if (planRepo.existsById(planId)) {
            planRepo.deleteById(planId);
            return "Plan deleted successfully.";
        }
        return "Plan not found.";
    }

    /**
     * Validate prerequisite/co-req ordering for every course in the plan.
     * Returns only courses that have unmet requirements.
     */
    @GetMapping("/{planId}/validate")
    public ResponseEntity<List<PlanViolationDTO>> validatePlan(
            @PathVariable int planId,
            @RequestParam(defaultValue = "Fall") String startSemester) {
        Optional<CoursePlan> planOpt = planRepo.findById(planId);
        if (planOpt.isEmpty()) return ResponseEntity.notFound().build();

        CoursePlan plan = planOpt.get();
        List<PlanCourse> planCourses = plan.getPlanCourses();

        // courseId → semester index reflecting the student's starting preference
        Map<Integer, Integer> courseIndexMap = new HashMap<>();
        for (PlanCourse pc : planCourses) {
            int idx = semesterIndex(pc.getYear(), pc.getAcademicPeriod().getName(), startSemester);
            courseIndexMap.put(pc.getCourse().getId(), idx);
        }

        // Already-completed courses satisfy any prereq regardless of position
        Set<Integer> takenIds = planCourses.stream()
            .filter(PlanCourse::isTaken)
            .map(pc -> pc.getCourse().getId())
            .collect(Collectors.toSet());

        List<PlanViolationDTO> violations = new ArrayList<>();

        for (PlanCourse pc : planCourses) {
            int courseId = pc.getCourse().getId();
            int coursePos = courseIndexMap.get(courseId);

            List<Prerequisite> prereqs = prerequisiteRepo.findByCourseIdOrderByLogicGroupId(courseId);
            if (prereqs.isEmpty()) continue;

            // Group by logicGroupId; null means standalone AND requirement (unique key per row)
            Map<Object, List<Prerequisite>> groups = new LinkedHashMap<>();
            for (Prerequisite p : prereqs) {
                Object key = p.getLogicGroupId() != null ? p.getLogicGroupId() : "solo_" + p.getId();
                groups.computeIfAbsent(key, k -> new ArrayList<>()).add(p);
            }

            List<PrereqGroupViolation> missingGroups = new ArrayList<>();

            for (List<Prerequisite> group : groups.values()) {
                boolean groupSatisfied = false;
                boolean allCoreq = group.stream().allMatch(p -> Boolean.TRUE.equals(p.getConcurrentAllowed()));

                for (Prerequisite p : group) {
                    // Already taken → always satisfied
                    if (takenIds.contains(p.getPrereqCourseId())) { groupSatisfied = true; break; }

                    Integer prereqPos = courseIndexMap.get(p.getPrereqCourseId());
                    if (prereqPos != null) {
                        boolean conc = Boolean.TRUE.equals(p.getConcurrentAllowed());
                        if (conc ? prereqPos <= coursePos : prereqPos < coursePos) {
                            groupSatisfied = true; break;
                        }
                    }
                }

                if (!groupSatisfied) {
                    List<String> options = new ArrayList<>();
                    for (Prerequisite p : group) {
                        courseRepo.findById(p.getPrereqCourseId())
                            .ifPresent(c -> options.add(c.getcourseNum()));
                    }
                    if (!options.isEmpty()) {
                        PrereqGroupViolation v = new PrereqGroupViolation();
                        v.setOptions(options);
                        v.setCoreq(allCoreq);
                        missingGroups.add(v);
                    }
                }
            }

            if (!missingGroups.isEmpty()) {
                PlanViolationDTO dto = new PlanViolationDTO();
                dto.setCourseCode(pc.getCourse().getcourseNum());
                dto.setCourseName(pc.getCourse().getCourseName());
                dto.setMissingGroups(missingGroups);
                violations.add(dto);
            }
        }

        return ResponseEntity.ok(violations);
    }

    private int semesterIndex(int year, String periodName, String startSemester) {
        String name = periodName != null ? periodName.toLowerCase() : "";
        boolean fallStart = !"Spring".equalsIgnoreCase(startSemester);
        int termOffset;
        if (name.contains("fall"))        termOffset = fallStart ? 0 : 2;
        else if (name.contains("winter")) termOffset = fallStart ? 1 : 3;
        else if (name.contains("spring")) termOffset = fallStart ? 2 : 0;
        else                               termOffset = fallStart ? 3 : 1; // summer
        return (year - 1) * 4 + termOffset;
    }

    /**
     * Helper method to transform Entity data into the Frontend's DTO format.
     */
    private CoursePlanDTO mapToDTO(CoursePlan plan) {
        CoursePlanDTO dto = new CoursePlanDTO();
        dto.setPlan_id(plan.getId());
        dto.setPlan_name(plan.getPlanName());
        dto.setTotal_credits(plan.getTotal_credits());

        List<CourseDTO> courseDTOList = plan.getPlanCourses().stream().map(pc -> {
            CourseDTO cDto = new CourseDTO();
            cDto.setYear(pc.getYear());
            cDto.setSemester(pc.getAcademicPeriod().getName()); // Extracts "Fall 2025" from the ID
            cDto.setCode(pc.getCourse().getcourseNum());
            cDto.setName(pc.getCourse().getCourseName());
            cDto.setCredits(Integer.parseInt(pc.getCourse().getCredits()));
            cDto.setTaken(pc.isTaken());
            String rawLabel = pc.getProgramLabel();
            cDto.setProgramLabels(rawLabel != null && !rawLabel.isEmpty()
                ? Arrays.asList(rawLabel.split(","))
                : new ArrayList<>());
            return cDto;
        }).collect(Collectors.toList());

        dto.setList_of_courses(courseDTOList);
        return dto;
    }

}
