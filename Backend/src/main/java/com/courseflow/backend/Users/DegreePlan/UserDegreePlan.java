// UserDegreePlan.java
package com.courseflow.backend.Users.DegreePlan;


import com.courseflow.backend.DegreePrograms.DegreeProgram;
import com.courseflow.backend.DegreePrograms.DegreeType;
import com.courseflow.backend.Users.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_degree_plans")
public class UserDegreePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The One-to-Many mapping back to the User
    @JsonIgnore // Prevents infinite JSON loops when returning the plan
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // We use FetchType.EAGER because when we load a plan, we almost always want to know the major's name
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "program_id", referencedColumnName = "program_id", nullable = false)
    private DegreeProgram degreeProgram;

    @Enumerated(EnumType.STRING)
    @Column(name = "degree_type", nullable = false)
    private DegreeType degreeType;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    // Automatically update the timestamp whenever this entity is saved
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }

    public UserDegreePlan() {}

    public UserDegreePlan(User user, DegreeProgram degreeProgram, DegreeType degreeType) {
        this.user = user;
        this.degreeProgram = degreeProgram;
        this.degreeType = degreeType;
    }

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public DegreeProgram getDegreeProgram() { return degreeProgram; }
    public void setDegreeProgram(DegreeProgram degreeProgram) { this.degreeProgram = degreeProgram; }

    public DegreeType getDegreeType() { return degreeType; }
    public void setDegreeType(DegreeType degreeType) { this.degreeType = degreeType; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}