package com.courseflow.backend.Users.DegreePlan;

import com.courseflow.backend.DegreePrograms.DegreeProgramService;
import com.courseflow.backend.DegreePrograms.RequirementDetailsDTO;
import com.courseflow.backend.DegreePrograms.RequirementRules;
import com.courseflow.backend.Users.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UserDegreePlanService {

    @Autowired
    private UserDegreePlanRepository planRepository;

    @Autowired
    private DegreeProgramService degreeService;

    public DegreeProgressSummary getDegreeProgressForUser(User user) {
        if (user == null || user.getId() == null) {
            return new DegreeProgressSummary(0, 128);
        }

        List<UserDegreePlan> plans = planRepository.findByUserId(user.getId());
        Set<String> completedIds = user.getCompletedCourseIds() != null
                ? user.getCompletedCourseIds()
                : Collections.emptySet();

        if (plans.isEmpty()) {
            return new DegreeProgressSummary(0, 128);
        }

        int bestCompletedCredits = 0;
        int bestRequiredCredits = 0;

        for (UserDegreePlan plan : plans) {

            // 🚨 FIX: Extract the ID from the new DegreeProgram object
            String actualProgramId = plan.getDegreeProgram().getProgramId();

            List<RequirementRules> rules = degreeService.getDegreeManifest(actualProgramId);
            Map<String, List<RequirementDetailsDTO>> structuredDegree =
                    degreeService.getStructuredDegree(actualProgramId);

            int totalRequiredCredits = 0;
            int totalCompletedCredits = 0;

            for (RequirementRules rule : rules) {
                String catName = rule.getCategoryName().name();
                String ruleGroupId = rule.getGroupId() != null
                        ? rule.getGroupId().name()
                        : "NONE";

                int ruleRequired = rule.getRequiredCredits();

                boolean isCheckboxRule =
                        catName.equals("INTERNATIONAL_PERSPECTIVES") ||
                                catName.equals("US_CULTURES_AND_COMMUNITIES") ||
                                catName.equals("COMMUNICATION_PROFICIENCY");

                if (!isCheckboxRule) {
                    totalRequiredCredits += ruleRequired;
                }

                List<RequirementDetailsDTO> allReqs =
                        structuredDegree.getOrDefault(catName, new ArrayList<>());

                int ruleCompleted = 0;

                for (RequirementDetailsDTO req : allReqs) {
                    String reqGroupId = req.getGroupId() != null
                            ? req.getGroupId()
                            : "NONE";

                    if (!reqGroupId.equals(ruleGroupId)) {
                        continue;
                    }

                    if (completedIds.contains(req.getCourseId())) {
                        ruleCompleted += parseCredits(req.getCredits());
                    }
                }

                if (!isCheckboxRule) {
                    totalCompletedCredits += Math.min(ruleCompleted, ruleRequired);
                }
            }

            // Moved debug statements OUTSIDE the loops so they only print once per plan!
            System.out.println("User: " + user.getNetid());
            System.out.println("Completed IDs: " + completedIds);
            System.out.println("Plan: " + actualProgramId);
            System.out.println("Total required: " + totalRequiredCredits);
            System.out.println("Total completed: " + totalCompletedCredits);

            if (totalRequiredCredits > bestRequiredCredits ||
                    (totalRequiredCredits == bestRequiredCredits &&
                            totalCompletedCredits > bestCompletedCredits)) {
                bestRequiredCredits = totalRequiredCredits;
                bestCompletedCredits = totalCompletedCredits;
            }

        }
        if (bestRequiredCredits == 0) {
            bestRequiredCredits = 128;
        }

        return new DegreeProgressSummary(bestCompletedCredits, bestRequiredCredits);
    }

    public int getCompletedCreditsForUser(User user) {
        return getDegreeProgressForUser(user).getCompletedCredits();
    }

    public int getRequiredCreditsForUser(User user) {
        return getDegreeProgressForUser(user).getRequiredCredits();
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

    public static class DegreeProgressSummary {
        private final int completedCredits;
        private final int requiredCredits;

        public DegreeProgressSummary(int completedCredits, int requiredCredits) {
            this.completedCredits = completedCredits;
            this.requiredCredits = requiredCredits;
        }

        public int getCompletedCredits() {
            return completedCredits;
        }

        public int getRequiredCredits() {
            return requiredCredits;
        }
    }
}