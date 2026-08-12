package com.courseflow.backend.SmartScheduler;

import java.util.List;

public class CourseResponseDTO {
    private Integer id;
    private String code;
    private String name;
    private String department;
    private String credits;
    private List<SectionDTO> sections;

    // Constructors
    public CourseResponseDTO() {}

    public CourseResponseDTO(Integer id, String code, String name, String department,
                             String credits, List<SectionDTO> sections) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.department = department;
        this.credits = credits;
        this.sections = sections;
    }

    // Inner DTO for Section
    public static class SectionDTO {
        private Integer id;
        private String sectionNum;
        private String instructor;
        private Integer capacity;
        private List<MeetingDTO> meetings;

        public SectionDTO() {}

        public SectionDTO(Integer id, String instructor, String sectionNum, Integer capacity, List<MeetingDTO> meetings) {
            this.id = id;
            this.instructor = instructor;
            this.sectionNum = sectionNum;
            this.capacity = capacity;
            this.meetings = meetings;
        }

        // Getters and setters for SectionDTO
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public String getSectionNum(){return sectionNum;}
        public void setSectionNum(String sectionNum) {this.sectionNum = sectionNum;}

        public String getInstructor() { return instructor; }
        public void setInstructor(String instructor) { this.instructor = instructor; }

        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }

        public List<MeetingDTO> getMeetings() { return meetings; }
        public void setMeetings(List<MeetingDTO> meetings) { this.meetings = meetings; }
    }

    // Inner DTO for Meeting
    public static class MeetingDTO {
        private String day;
        private String start;
        private String end;

        public MeetingDTO() {}

        public MeetingDTO(String day, String start, String end) {
            this.day = day;
            this.start = start;
            this.end = end;
        }

        // Getters and setters for MeetingDTO
        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }

        public String getStart() { return start; }
        public void setStart(String start) { this.start = start; }

        public String getEnd() { return end; }
        public void setEnd(String end) { this.end = end; }
    }

    // Getters and setters for CourseResponseDTO
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getCredits() { return credits; }
    public void setCredits(String credits) { this.credits = credits; }

    public List<SectionDTO> getSections() { return sections; }
    public void setSections(List<SectionDTO> sections) { this.sections = sections; }
}