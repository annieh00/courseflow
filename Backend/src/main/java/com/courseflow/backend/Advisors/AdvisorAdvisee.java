//AdvisorAdvisee.java - Entity representing the relationship between an advisor and their advisee (student)
package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import jakarta.persistence.*;

@Entity
@Table(
        name = "advisor_advisees",
        uniqueConstraints = @UniqueConstraint(columnNames = {"advisor_id", "student_id"})
)
public class AdvisorAdvisee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "advisor_id", nullable = false)
    private User advisor;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    public AdvisorAdvisee() {}

    public AdvisorAdvisee(User advisor, User student) {
        this.advisor = advisor;
        this.student = student;
    }

    public Long getId() { return id; }
    public User getAdvisor() { return advisor; }
    public User getStudent() { return student; }
}