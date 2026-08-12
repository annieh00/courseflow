package com.courseflow.backend.advising.entities;

import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "notes")
public class NoteEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "advisor_id")
    private UUID advisorId;

    @Column(name = "note_date")
    private java.time.OffsetDateTime noteDate;

    @Column(name = "type")
    private String type;

    @Column(name = "summary")
    private String summary;

    @Column(name = "detail")
    private String detail;

    public NoteEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public UUID getAdvisorId() { return advisorId; }
    public void setAdvisorId(UUID advisorId) { this.advisorId = advisorId; }
    public java.time.OffsetDateTime getNoteDate() { return noteDate; }
    public void setNoteDate(java.time.OffsetDateTime noteDate) { this.noteDate = noteDate; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
