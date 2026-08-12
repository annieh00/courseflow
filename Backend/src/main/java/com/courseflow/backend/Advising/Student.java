package com.courseflow.backend.advising;

public class Student {
    private String id;
    private String name;
    private String netid;
    private String major;
    private String classStanding;
    private Double gpa;
    private Integer creditsCompleted;
    private Integer creditsRequired;
    private Integer graduationYear;
    private String photoUrl;

    public Student() {}

    public Student(String id, String name, String netid, String major, String classStanding, Double gpa,
                   Integer creditsCompleted, Integer creditsRequired, Integer graduationYear, String photoUrl) {
        this.id = id;
        this.name = name;
        this.netid = netid;
        this.major = major;
        this.classStanding = classStanding;
        this.gpa = gpa;
        this.creditsCompleted = creditsCompleted;
        this.creditsRequired = creditsRequired;
        this.graduationYear = graduationYear;
        this.photoUrl = photoUrl;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getNetid() { return netid; }
    public void setNetid(String netid) { this.netid = netid; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getClassStanding() { return classStanding; }
    public void setClassStanding(String classStanding) { this.classStanding = classStanding; }
    public Double getGpa() { return gpa; }
    public void setGpa(Double gpa) { this.gpa = gpa; }
    public Integer getCreditsCompleted() { return creditsCompleted; }
    public void setCreditsCompleted(Integer creditsCompleted) { this.creditsCompleted = creditsCompleted; }
    public Integer getCreditsRequired() { return creditsRequired; }
    public void setCreditsRequired(Integer creditsRequired) { this.creditsRequired = creditsRequired; }
    public Integer getGraduationYear() { return graduationYear; }
    public void setGraduationYear(Integer graduationYear) { this.graduationYear = graduationYear; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
