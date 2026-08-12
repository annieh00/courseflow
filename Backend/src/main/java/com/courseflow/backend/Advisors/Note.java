package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // notes.user_id NOT NULL
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // nullable
    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    // nullable
    @ManyToOne
    @JoinColumn(name = "advisor_id")
    private User advisor;

    @Column(name = "content", nullable = false, length = 255)
    private String content;

    @Column(name = "note_type", length = 255)
    private String noteType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Note() {}

    public Long getId() { return id; }
    public User getUser() { return user; }
    public User getStudent() { return student; }
    public User getAdvisor() { return advisor; }
    public String getContent() { return content; }
    public String getNoteType() { return noteType; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // inside Note.java
    public void setUser(com.courseflow.backend.Users.User user) { this.user = user; }
    public void setStudent(com.courseflow.backend.Users.User student) { this.student = student; }
    public void setAdvisor(com.courseflow.backend.Users.User advisor) { this.advisor = advisor; }
    public void setContent(String content) { this.content = content; }
    public void setNoteType(String noteType) { this.noteType = noteType; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
}