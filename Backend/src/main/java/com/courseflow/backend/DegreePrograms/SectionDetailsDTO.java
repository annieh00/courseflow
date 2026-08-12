package com.courseflow.backend.DegreePrograms;

public class SectionDetailsDTO {
    private String semester;        // e.g., "Fall 2025" (From Academic Period)
    private String meetingPatterns; // e.g., "MWF | 9:55 AM - 10:45 AM"
    private Integer openSeats;      // Nice to have for registration

    private String sectionNumber;   // NEW
    private String instructors;     // NEW
    private String locations;       // NEW
    // --- GETTERS AND SETTERS ---
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public String getMeetingPatterns() { return meetingPatterns; }
    public void setMeetingPatterns(String meetingPatterns) { this.meetingPatterns = meetingPatterns; }
    public Integer getOpenSeats() { return openSeats; }
    public void setOpenSeats(Integer openSeats) { this.openSeats = openSeats; }

    public String getSectionNumber() { return sectionNumber; }
    public void setSectionNumber(String sectionNumber) { this.sectionNumber = sectionNumber; }
    public String getInstructors() { return instructors; }
    public void setInstructors(String instructors) { this.instructors = instructors; }
    public String getLocations() { return locations; }
    public void setLocations(String locations) { this.locations = locations; }
}