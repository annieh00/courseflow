// java/com/courseflow/backend/Advisors/ScheduleSlot.java
package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "schedule_slot")
public class ScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "advisor_id", nullable = false)
    private User advisor;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ScheduleStatus status = ScheduleStatus.OPEN;

    /** ID of the AdvisorWeeklySlot that generated this slot, or null if manually created. */
    @Column(name = "from_weekly_slot_id")
    private Long fromWeeklySlotId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public ScheduleSlot() {}

    public ScheduleSlot(User advisor, User student, LocalDate slotDate,
                        LocalTime startTime, LocalTime endTime, ScheduleStatus status) {
        this.advisor = advisor;
        this.student = student;
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
    }

    public Long getId() { return id; }
    public User getAdvisor() { return advisor; }
    public void setAdvisor(User advisor) { this.advisor = advisor; }

    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }

    public LocalDate getSlotDate() { return slotDate; }
    public void setSlotDate(LocalDate slotDate) { this.slotDate = slotDate; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public ScheduleStatus getStatus() { return status; }
    public void setStatus(ScheduleStatus status) { this.status = status; }

    public Long getFromWeeklySlotId() { return fromWeeklySlotId; }
    public void setFromWeeklySlotId(Long fromWeeklySlotId) { this.fromWeeklySlotId = fromWeeklySlotId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}