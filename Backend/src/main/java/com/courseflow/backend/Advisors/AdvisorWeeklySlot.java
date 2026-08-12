package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(
    name = "advisor_weekly_slots",
    uniqueConstraints = @UniqueConstraint(columnNames = {"advisor_id", "day_of_week", "start_time"})
)
public class AdvisorWeeklySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "advisor_id", nullable = false)
    private User advisor;

    /** ISO day-of-week: 1=Monday … 7=Sunday */
    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    public AdvisorWeeklySlot() {}

    public AdvisorWeeklySlot(User advisor, int dayOfWeek, LocalTime startTime, LocalTime endTime) {
        this.advisor = advisor;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Long getId() { return id; }
    public User getAdvisor() { return advisor; }
    public int getDayOfWeek() { return dayOfWeek; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}
