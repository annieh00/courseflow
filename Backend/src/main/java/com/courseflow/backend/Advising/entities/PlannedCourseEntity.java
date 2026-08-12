package com.courseflow.backend.advising.entities;

import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "planned_courses")
public class PlannedCourseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "course_code", nullable = false)
    private String courseCode;

    @Column(name = "title")
    private String title;

    @Column(name = "term")
    private String term;

    @Column(name = "status")
    private String status;

    @Column(name = "credits")
    private Integer credits;

    public PlannedCourseEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
}
