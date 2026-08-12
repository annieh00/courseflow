package com.courseflow.backend.advising.entities;

import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "students")
public class StudentEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "netid", unique = true, nullable = false)
    private String netid;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "major")
    private String major;

    @Column(name = "minor")
    private String minor;

    @Column(name = "class_standing")
    private String classStanding;

    @Column(name = "gpa")
    private Double gpa;

    @Column(name = "credits_completed")
    private Integer creditsCompleted;

    @Column(name = "credits_required")
    private Integer creditsRequired;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "photo_url")
    private String photoUrl;

    public StudentEntity() {}

    // getters & setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getNetid() { return netid; }
    public void setNetid(String netid) { this.netid = netid; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getMinor() { return minor; }
    public void setMinor(String minor) { this.minor = minor; }
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
