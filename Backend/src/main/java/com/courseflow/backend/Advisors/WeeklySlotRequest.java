package com.courseflow.backend.Advisors;

public class WeeklySlotRequest {
    /** ISO day-of-week: 1=Monday … 7=Sunday */
    private int dayOfWeek;
    private String startTime;  // "HH:MM"
    private String endTime;    // "HH:MM"

    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
}
