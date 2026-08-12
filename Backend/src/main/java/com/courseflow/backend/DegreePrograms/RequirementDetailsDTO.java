package com.courseflow.backend.DegreePrograms;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RequirementDetailsDTO {
    private Long requirementId;
    private String requirementType;
    private String minGrade;
    private String groupId;

    // Enriched Course Info
    private String courseId;
    private String courseNumber; // e.g., "SE 3290"
    private String courseTitle;  // e.g., "Software Project Management"
    private String credits;

    // Enriched Section/Schedule Info
    private List<SectionDetailsDTO> offeredSections;

    // --- GETTERS AND SETTERS ---
    public Long getRequirementId() { return requirementId; }
    public void setRequirementId(Long requirementId) { this.requirementId = requirementId; }
    public String getRequirementType() { return requirementType; }
    public void setRequirementType(String requirementType) { this.requirementType = requirementType; }
    public String getMinGrade() { return minGrade; }
    public void setMinGrade(String minGrade) { this.minGrade = minGrade; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getCourseNumber() { return courseNumber; }
    public void setCourseNumber(String courseNumber) { this.courseNumber = courseNumber; }
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }
    public String getCredits() { return credits; }
    public void setCredits(String credits) { this.credits = credits; }
    public List<SectionDetailsDTO> getOfferedSections() { return offeredSections; }
    public void setOfferedSections(List<SectionDetailsDTO> offeredSections) { this.offeredSections = offeredSections; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
}