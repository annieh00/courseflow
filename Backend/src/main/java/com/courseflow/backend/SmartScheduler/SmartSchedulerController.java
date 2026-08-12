package com.courseflow.backend.SmartScheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class SmartSchedulerController {

    @Autowired
    private SmartScheduler smartScheduler;

    @GetMapping("/{academicPeriod}")
    public ResponseEntity<List<CourseResponseDTO>> searchCourses(
            @PathVariable("academicPeriod") String academicPeriod,
            @RequestParam(value = "search", required = false) String searchTerm) {

        List<CourseResponseDTO> courses = smartScheduler.searchCourses(searchTerm, academicPeriod);
        return ResponseEntity.ok(courses);
    }

    @RestController
    @RequestMapping("/api/sections")
    @CrossOrigin(origins = "*")
    // e.g /api/sections/by-courses?academicPeriodId=1&courseNumbers=COMS%203270,MATH%202010
    public class SectionController {

        @Autowired
        private SmartScheduler smartScheduler;

        @GetMapping("/by-courses")
        public ResponseEntity<?> getSectionsForCourses(
                @RequestParam Integer academicPeriodId,
                @RequestParam List<String> courseNumbers
        ) {

            return ResponseEntity.ok(
                    smartScheduler.getSectionsForCourses(courseNumbers, academicPeriodId)
            );
        }
    }
}