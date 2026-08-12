package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.JwtService;
import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedule")
@CrossOrigin(origins = "*")
public class ScheduleAdvisorsController {

    private final ScheduleSlotRepository scheduleSlotRepo;
    private final AdvisorWeeklySlotRepository weeklySlotRepo;
    private final ScheduleSlotService scheduleSlotService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public ScheduleAdvisorsController(
            ScheduleSlotRepository scheduleSlotRepo,
            AdvisorWeeklySlotRepository weeklySlotRepo,
            ScheduleSlotService scheduleSlotService,
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.scheduleSlotRepo = scheduleSlotRepo;
        this.weeklySlotRepo = weeklySlotRepo;
        this.scheduleSlotService = scheduleSlotService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // ONE-TIME SLOTS
    // ─────────────────────────────────────────────────────────────

    /** Returns all upcoming slots (OPEN + BOOKED) for the given advisor. */
    @GetMapping("/{advisorNetid}")
    public List<Map<String, Object>> getAdvisorSchedule(@PathVariable String advisorNetid) {
        LocalDate today = LocalDate.now();

        return scheduleSlotRepo
                .findByAdvisor_NetidAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(advisorNetid, today)
                .stream()
                .map(slot -> {
                    User student = slot.getStudent();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", slot.getId());
                    m.put("advisorId", slot.getAdvisor().getId());
                    m.put("advisorNetid", slot.getAdvisor().getNetid());
                    m.put("studentId", student != null ? student.getId() : null);
                    m.put("studentNetid", student != null ? student.getNetid() : null);
                    m.put("studentName", student != null ? student.getFullName() : null);
                    m.put("slotDate", slot.getSlotDate());
                    m.put("startTime", slot.getStartTime());
                    m.put("endTime", slot.getEndTime());
                    m.put("status", slot.getStatus().name());
                    return m;
                })
                .collect(Collectors.toList());
    }

    /** Advisor creates a new slot (OPEN or BOOKED with a specific student). */
    @PostMapping("/slots")
    public ResponseEntity<?> createSlot(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateSlotRequest request) {
        try {
            Long advisorId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            LocalDate date = LocalDate.parse(request.getSlotDate());
            LocalTime start = LocalTime.parse(request.getStartTime());
            LocalTime end = LocalTime.parse(request.getEndTime());

            if (!end.isAfter(start)) {
                return ResponseEntity.badRequest().body("End time must be after start time");
            }

            ScheduleSlot slot = scheduleSlotService.createSlot(
                    advisorId, date, start, end, request.getStudentNetid());

            User student = slot.getStudent();
            Map<String, Object> m = new HashMap<>();
            m.put("id", slot.getId());
            m.put("slotDate", slot.getSlotDate());
            m.put("startTime", slot.getStartTime());
            m.put("endTime", slot.getEndTime());
            m.put("status", slot.getStatus().name());
            m.put("studentNetid", student != null ? student.getNetid() : null);
            m.put("studentName", student != null ? student.getFullName() : null);
            return ResponseEntity.ok(m);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create slot: " + e.getMessage());
        }
    }

    /** Advisor deletes one of their own OPEN slots. */
    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<?> deleteSlot(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long slotId) {
        try {
            Long advisorId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            scheduleSlotService.deleteSlot(slotId, advisorId);
            return ResponseEntity.ok("Slot deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete slot: " + e.getMessage());
        }
    }

    /** Student books an open slot. */
    @PostMapping("/{slotId}/book/{studentId}")
    public ResponseEntity<ScheduleSlot> bookSlot(
            @PathVariable Long slotId,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(scheduleSlotService.bookSlot(slotId, studentId));
    }

    // ─────────────────────────────────────────────────────────────
    // STUDENT SCHEDULING
    // ─────────────────────────────────────────────────────────────

    /** Returns all OPEN future slots from the authenticated student's advisor(s). */
    @GetMapping("/student/open-slots")
    public ResponseEntity<?> getOpenSlotsForStudent(
            @RequestHeader("Authorization") String authHeader) {
        try {
            Long studentId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            List<ScheduleSlot> slots = scheduleSlotService.getOpenSlotsForStudentAdvisors(studentId);

            List<Map<String, Object>> result = slots.stream().map(slot -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", slot.getId());
                m.put("advisorId", slot.getAdvisor().getId());
                m.put("advisorNetid", slot.getAdvisor().getNetid());
                m.put("advisorName", slot.getAdvisor().getFullName());
                m.put("slotDate", slot.getSlotDate());
                m.put("startTime", slot.getStartTime());
                m.put("endTime", slot.getEndTime());
                m.put("status", slot.getStatus().name());
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch open slots: " + e.getMessage());
        }
    }

    /** Returns all appointments booked by the authenticated student. */
    @GetMapping("/student/appointments")
    public ResponseEntity<?> getStudentAppointments(
            @RequestHeader("Authorization") String authHeader) {
        try {
            Long studentId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            List<ScheduleSlot> slots = scheduleSlotService.getStudentAppointments(studentId);

            List<Map<String, Object>> result = slots.stream().map(slot -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", slot.getId());
                m.put("advisorId", slot.getAdvisor().getId());
                m.put("advisorNetid", slot.getAdvisor().getNetid());
                m.put("advisorName", slot.getAdvisor().getFullName());
                m.put("slotDate", slot.getSlotDate());
                m.put("startTime", slot.getStartTime());
                m.put("endTime", slot.getEndTime());
                m.put("status", slot.getStatus().name());
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch appointments: " + e.getMessage());
        }
    }

    /** Student cancels one of their own booked appointments; slot reverts to OPEN. */
    @DeleteMapping("/student/appointments/{slotId}")
    public ResponseEntity<?> cancelAppointment(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long slotId) {
        try {
            Long studentId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            scheduleSlotService.cancelAppointment(slotId, studentId);
            return ResponseEntity.ok("Appointment cancelled");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to cancel appointment: " + e.getMessage());
        }
    }

    /** Student books a specific time window within an OPEN slot (15-min intervals). */
    @PostMapping("/{slotId}/book-window")
    public ResponseEntity<?> bookWindow(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long slotId,
            @RequestBody BookWindowRequest request) {
        try {
            Long studentId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            LocalTime windowStart = LocalTime.parse(request.getWindowStart());
            LocalTime windowEnd = LocalTime.parse(request.getWindowEnd());
            ScheduleSlot slot = scheduleSlotService.bookWindow(slotId, studentId, windowStart, windowEnd);

            Map<String, Object> m = new HashMap<>();
            m.put("id", slot.getId());
            m.put("advisorId", slot.getAdvisor().getId());
            m.put("advisorNetid", slot.getAdvisor().getNetid());
            m.put("advisorName", slot.getAdvisor().getFullName());
            m.put("slotDate", slot.getSlotDate());
            m.put("startTime", slot.getStartTime());
            m.put("endTime", slot.getEndTime());
            m.put("status", slot.getStatus().name());
            return ResponseEntity.ok(m);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to book: " + e.getMessage());
        }
    }

    /** Returns OPEN future slots from all advisors except the student's own assigned advisor(s). */
    @GetMapping("/student/other-advisor-slots")
    public ResponseEntity<?> getOtherAdvisorsOpenSlots(
            @RequestHeader("Authorization") String authHeader) {
        try {
            Long studentId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            List<ScheduleSlot> slots = scheduleSlotService.getOtherAdvisorsOpenSlots(studentId);

            List<Map<String, Object>> result = slots.stream().map(slot -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", slot.getId());
                m.put("advisorId", slot.getAdvisor().getId());
                m.put("advisorNetid", slot.getAdvisor().getNetid());
                m.put("advisorName", slot.getAdvisor().getFullName());
                m.put("slotDate", slot.getSlotDate());
                m.put("startTime", slot.getStartTime());
                m.put("endTime", slot.getEndTime());
                m.put("status", slot.getStatus().name());
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch other advisor slots: " + e.getMessage());
        }
    }

    public static class BookWindowRequest {
        private String windowStart;
        private String windowEnd;

        public String getWindowStart() { return windowStart; }
        public void setWindowStart(String windowStart) { this.windowStart = windowStart; }
        public String getWindowEnd() { return windowEnd; }
        public void setWindowEnd(String windowEnd) { this.windowEnd = windowEnd; }
    }

    // ─────────────────────────────────────────────────────────────
    // WEEKLY TEMPLATE
    // ─────────────────────────────────────────────────────────────

    /** Returns the advisor's recurring weekly template slots. */
    @GetMapping("/weekly/{advisorNetid}")
    public List<Map<String, Object>> getWeeklyTemplate(@PathVariable String advisorNetid) {
        return weeklySlotRepo
                .findByAdvisor_NetidOrderByDayOfWeekAscStartTimeAsc(advisorNetid)
                .stream()
                .map(ws -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", ws.getId());
                    m.put("dayOfWeek", ws.getDayOfWeek());
                    m.put("startTime", ws.getStartTime());
                    m.put("endTime", ws.getEndTime());
                    return m;
                })
                .collect(Collectors.toList());
    }

    /** Advisor adds a slot to their weekly template and auto-generates the next 90 days. */
    @PostMapping("/weekly")
    public ResponseEntity<?> addWeeklySlot(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody WeeklySlotRequest request) {
        try {
            Long advisorId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));

            if (request.getDayOfWeek() < 1 || request.getDayOfWeek() > 7) {
                return ResponseEntity.badRequest().body("dayOfWeek must be 1 (Mon) – 7 (Sun)");
            }

            LocalTime start = LocalTime.parse(request.getStartTime());
            LocalTime end = LocalTime.parse(request.getEndTime());

            if (!end.isAfter(start)) {
                return ResponseEntity.badRequest().body("End time must be after start time");
            }

            Map<String, Object> result = scheduleSlotService.createWeeklySlotAndApply(
                    advisorId, request.getDayOfWeek(), start, end);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add weekly slot: " + e.getMessage());
        }
    }

    /** Advisor updates an existing weekly slot's times and propagates changes to future open slots. */
    @PutMapping("/weekly/{weeklySlotId}")
    public ResponseEntity<?> updateWeeklySlot(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long weeklySlotId,
            @RequestBody UpdateWeeklySlotRequest request) {
        try {
            Long advisorId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            AdvisorWeeklySlot ws = weeklySlotRepo.findById(weeklySlotId)
                    .orElseThrow(() -> new RuntimeException("Weekly slot not found"));

            if (!ws.getAdvisor().getId().equals(advisorId)) {
                return ResponseEntity.status(403).body("Not authorized");
            }

            LocalTime newStart = LocalTime.parse(request.getStartTime());
            LocalTime newEnd = LocalTime.parse(request.getEndTime());

            if (!newEnd.isAfter(newStart)) {
                return ResponseEntity.badRequest().body("End time must be after start time");
            }

            ws.setStartTime(newStart);
            ws.setEndTime(newEnd);
            weeklySlotRepo.save(ws);

            int updated = scheduleSlotService.propagateWeeklySlotUpdate(advisorId, weeklySlotId, newStart, newEnd);

            Map<String, Object> m = new HashMap<>();
            m.put("id", ws.getId());
            m.put("dayOfWeek", ws.getDayOfWeek());
            m.put("startTime", ws.getStartTime());
            m.put("endTime", ws.getEndTime());
            m.put("updatedInCalendar", updated);
            return ResponseEntity.ok(m);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update weekly slot: " + e.getMessage());
        }
    }

    /** Advisor removes a slot from their weekly template and deletes all future open slots it generated. */
    @DeleteMapping("/weekly/{weeklySlotId}")
    public ResponseEntity<?> deleteWeeklySlot(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long weeklySlotId) {
        try {
            Long advisorId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
            AdvisorWeeklySlot ws = weeklySlotRepo.findById(weeklySlotId)
                    .orElseThrow(() -> new RuntimeException("Weekly slot not found"));

            if (!ws.getAdvisor().getId().equals(advisorId)) {
                return ResponseEntity.status(403).body("Not authorized");
            }

            int removed = scheduleSlotService.removeWeeklySlotFromCalendar(advisorId, weeklySlotId);
            weeklySlotRepo.deleteById(weeklySlotId);
            return ResponseEntity.ok(Map.of("removedFromCalendar", removed));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete weekly slot: " + e.getMessage());
        }
    }

    public static class UpdateWeeklySlotRequest {
        private String startTime;
        private String endTime;

        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
    }
}
