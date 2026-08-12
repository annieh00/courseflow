//Dashboard.java
package com.courseflow.backend.Dashboard;

import com.courseflow.backend.Degrees.Degree;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import com.courseflow.backend.Dashboard.*;;

@Service
public class Dashboard{

    @Autowired
    private DashboardRepository dashboardRepository;

    public DashboardDTO getUserDashboardProgress(Long userId) {
        // 1. Get user's degree plan
        UserDegreePlan degreePlan = dashboardRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No degree plan found for user: " + userId));

        // 2. Get requirements for this degree type (MAJOR/MINOR)
        List<Degree> requirements = dashboardRepository.findRequirementsByDegreeType(
                degreePlan.getDegreeType().toString()
        );

        // TODO: Replace with actual query to user_completed_courses table
        // List<UserCompletedCourse> completedCourses = completedCourseRepository.findByUserId(userId);
        // int totalCompleted = completedCourses.stream().mapToInt(c -> getCredits(c.getCourseId())).sum();

        // DUMMY DATA FOR NOW
        int totalCompleted = 45; // Hardcoded dummy value

        // Calculate total credits required
        int totalRequired = requirements.stream()
                .mapToInt(Degree::getCredits_required)
                .sum();

        // If requirements is empty, use dummy value
        if (totalRequired == 0) {
            totalRequired = 120; // Dummy value for testing
        }

        // Calculate overall progress
        double overallProgress = totalRequired > 0 ?
                (totalCompleted * 100.0) / totalRequired : 0;

        // Return DTO
        return new DashboardDTO(
                degreePlan.getDegreeProgram().getProgramId(),
                degreePlan.getDegreeType().toString(),
                totalRequired,
                totalCompleted,
                overallProgress
        );
    }
}