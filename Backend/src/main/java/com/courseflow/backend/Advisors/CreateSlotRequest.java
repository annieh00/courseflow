package com.courseflow.backend.Advisors;

public class CreateSlotRequest {
    private String slotDate;      // "2026-04-20"
    private String startTime;     // "09:00"
    private String endTime;       // "10:00"
    private String studentNetid;  // optional — when set, slot is created as BOOKED

    public String getSlotDate() { return slotDate; }
    public void setSlotDate(String slotDate) { this.slotDate = slotDate; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getStudentNetid() { return studentNetid; }
    public void setStudentNetid(String studentNetid) { this.studentNetid = studentNetid; }
}
