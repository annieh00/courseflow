package com.courseflow.backend.DegreePrograms;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/degree")
@CrossOrigin(origins = "*") // Allows your frontend to access this API without CORS errors
public class DegreeProgramController {

    @Autowired
    private DegreeProgramService degreeService;

    // Endpoint 1: Get the "Rules" (Credit Breakdown)
    // URL: GET http://localhost:8080/api/degree/SE/credits
    @GetMapping("/{programId}/credits")
    public ResponseEntity<List<RequirementRules>> getCreditBreakdown(@PathVariable String programId) {
        return ResponseEntity.ok(degreeService.getDegreeManifest(programId));
    }

    // Endpoint 2: Get ALL classes for the major
    // URL: GET http://localhost:8080/api/degree/SE/classes
    @GetMapping("/{programId}/classes")
    public ResponseEntity<List<ProgramRequirements>> getAllClasses(@PathVariable String programId) {
        return ResponseEntity.ok(degreeService.getAllProgramClasses(programId));
    }

    // Endpoint 3: Get specific electives (Now Enriched!)
    // URL: GET http://localhost:8080/api/degree/SE/electives?type=SOFTWARE_ENGINEERING_ELECTIVE
    @GetMapping("/{programId}/electives")
    public ResponseEntity<List<RequirementDetailsDTO>> getElectives(
            @PathVariable String programId,
            @RequestParam String type) {
        try {
            // Changed from getElectives to getEnrichedElectives
            return ResponseEntity.ok(degreeService.getEnrichedElectives(programId, type));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Endpoint 4: Get classes grouped by category (ENRICHED)
    // URL: GET http://localhost:8080/api/degree/SE/structured
    @GetMapping("/{programId}/structured")
    public ResponseEntity<Map<String, List<RequirementDetailsDTO>>> getStructuredDegree(@PathVariable String programId) {
        return ResponseEntity.ok(degreeService.getStructuredDegree(programId));
    }

    // Endpoint 5: Get all available degree programs
    // URL: GET http://localhost:8080/api/degree/available
    @GetMapping("/available")
    public ResponseEntity<List<DegreeOptionDTO>> getAvailablePrograms() {
        return ResponseEntity.ok(degreeService.getAvailablePrograms());
    }
}