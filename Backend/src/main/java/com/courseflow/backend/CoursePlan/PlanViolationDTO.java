package com.courseflow.backend.CoursePlan;

import java.util.List;

public class PlanViolationDTO {
    private String courseCode;
    private String courseName;
    private List<PrereqGroupViolation> missingGroups;

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public List<PrereqGroupViolation> getMissingGroups() { return missingGroups; }
    public void setMissingGroups(List<PrereqGroupViolation> missingGroups) { this.missingGroups = missingGroups; }
}
