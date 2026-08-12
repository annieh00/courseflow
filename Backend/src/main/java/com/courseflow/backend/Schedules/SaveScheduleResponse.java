package com.courseflow.backend.Schedules;

import java.time.Instant;

public class SaveScheduleResponse {
    private String id;
    private Instant savedAt;

    public SaveScheduleResponse(String id, Instant savedAt) {
        this.id = id;
        this.savedAt = savedAt;
    }

    // Getters
    public String getId() { return id; }
    public Instant getSavedAt() { return savedAt; }
}