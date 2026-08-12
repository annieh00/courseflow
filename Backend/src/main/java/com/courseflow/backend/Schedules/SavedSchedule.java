package com.courseflow.backend.Schedules;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "saved_schedules")
public class SavedSchedule {

    @Id
    @Column(name = "schedule_id", length = 50)
    private String scheduleId;

    @Column(name = "net_Id", nullable = false)
    private String netId;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "schedule_data", columnDefinition = "jsonb", nullable = false)
    private String scheduleData;

    @Column(name = "created_at")
    private Instant createdAt;

    // Constructors
    public SavedSchedule() {}

    public SavedSchedule(String scheduleId, String netId, Instant savedAt, String scheduleData) {
        this.scheduleId = scheduleId;
        this.netId = netId;
        this.savedAt = savedAt;
        this.scheduleData = scheduleData;
        this.createdAt = Instant.now();
    }

    // Getters and setters
    public String getScheduleId() { return scheduleId; }
    public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }

    public String getNetId() { return netId; }
    public void setNetId(String netId) { this.netId = netId; }

    public Instant getSavedAt() { return savedAt; }
    public void setSavedAt(Instant savedAt) { this.savedAt = savedAt; }

    public String getScheduleData() { return scheduleData; }
    public void setScheduleData(String scheduleData) { this.scheduleData = scheduleData; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}