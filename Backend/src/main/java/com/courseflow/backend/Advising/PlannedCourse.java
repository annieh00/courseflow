package com.courseflow.backend.advising;

public class PlannedCourse {
    private String id;
    private String code;
    private String title;
    private String term;
    private String status; // planned | in-progress | completed
    private Integer credits;

    public PlannedCourse() {}

    public PlannedCourse(String id, String code, String title, String term, String status, Integer credits) {
        this.id = id;
        this.code = code;
        this.title = title;
        this.term = term;
        this.status = status;
        this.credits = credits;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
}
