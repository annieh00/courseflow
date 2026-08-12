package com.courseflow.backend.Dashboard;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private Dashboard dashboardService;

    @GetMapping("/{userId}/progress")
    public ResponseEntity<DashboardDTO> getUserProgress(@PathVariable Long userId) {
        try {
            DashboardDTO progress = dashboardService.getUserDashboardProgress(userId);
            return ResponseEntity.ok(progress);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}