package com.courseflow.backend.Schedules;

import com.courseflow.backend.Users.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ScheduleController {

    @Autowired
    private SavedScheduleRepository savedScheduleRepository;

    @Autowired
    private ScheduleValidationService validationService;

    @Autowired
    private UserRepository userRepository;  // Add this

    @Autowired
    private ObjectMapper objectMapper;

    // Helper method to validate user
    private Optional<String> validateUser(String netId) {
        if (netId == null || netId.trim().isEmpty()) {
            return Optional.of("netId is required");
        }

        boolean userExists = userRepository.existsByNetid(netId);
        if (!userExists) {
            return Optional.of("User with netId '" + netId + "' does not exist");
        }

        return Optional.empty();
    }

    // POST /api/schedules
    @PostMapping("/schedules")
    public ResponseEntity<?> saveSchedule(
            @RequestParam String netId,
            @RequestBody SaveScheduleRequest request) {

        // 1. Validate user
        Optional<String> userError = validateUser(netId);
        if (userError.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", userError.get()));
        }

        // 2. Validate schedule (sections only, no blocked times needed)
        ScheduleValidationService.ValidationResult validation =
                validationService.validateSchedule(netId, request);

        if (!validation.isValid()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Invalid schedule");
            errorResponse.put("errors", validation.getErrors());
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // 3. Save the schedule
        try {
            // Generate a unique schedule ID
            String scheduleId = "schedule_" + UUID.randomUUID().toString().substring(0, 8);

            // Convert request to JSON for storage
            // (You can remove blockedTimes from request if you really don't want to store them)
            String scheduleJson = objectMapper.writeValueAsString(request);

            // Create and save the schedule
            SavedSchedule savedSchedule = new SavedSchedule(
                    scheduleId,
                    netId,
                    Instant.now(),
                    scheduleJson
            );

            savedScheduleRepository.save(savedSchedule);

            // Return the ID and timestamp
            return ResponseEntity.ok(new SaveScheduleResponse(scheduleId, savedSchedule.getSavedAt()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save schedule: " + e.getMessage()));
        }
    }

    // GET /api/schedules
    @GetMapping("/schedules")
    public ResponseEntity<?> getUserSchedules(@RequestParam String netId) {
        List<SavedSchedule> schedules = savedScheduleRepository.findByNetId(netId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (SavedSchedule s : schedules) {
            result.add(Map.of(
                    "id", s.getScheduleId(),
                    "savedAt", s.getSavedAt()
            ));
        }
        return ResponseEntity.ok(result);
    }

    // DELETE /api/schedules/{scheduleId}
    @DeleteMapping("/schedules/{scheduleId}")
    public ResponseEntity<?> deleteSchedule(
            @PathVariable String scheduleId,
            @RequestParam String netId) {

        // Validate user
        Optional<String> error = validateUser(netId);
        if (error.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", error.get()));
        }

        // Check if schedule exists
        Optional<SavedSchedule> opt = savedScheduleRepository.findById(scheduleId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SavedSchedule schedule = opt.get();

        // Verify ownership
        if (!schedule.getNetId().equals(netId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have permission to delete this schedule"));
        }

        savedScheduleRepository.deleteById(scheduleId);
        return ResponseEntity.ok(Map.of("message", "Schedule deleted successfully"));
    }
}