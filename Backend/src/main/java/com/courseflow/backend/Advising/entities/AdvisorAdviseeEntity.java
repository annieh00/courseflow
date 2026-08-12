package com.courseflow.backend.advising.entities;

import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "advisor_advisees")
public class AdvisorAdviseeEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "advisor_id", nullable = false)
    private UUID advisorId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    public AdvisorAdviseeEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAdvisorId() { return advisorId; }
    public void setAdvisorId(UUID advisorId) { this.advisorId = advisorId; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
}
