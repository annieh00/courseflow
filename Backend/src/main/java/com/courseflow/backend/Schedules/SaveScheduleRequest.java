package com.courseflow.backend.Schedules;

import java.util.List;

public class SaveScheduleRequest {
    private String netId;
    private List<String> selectedSections;
    private List<BlockedTime> blockedTimes;
    private String academicPeriodName;

    public static class BlockedTime {
        private String day;
        private String start;
        private String end;

        // getters/setters
        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }
        public String getStart() { return start; }
        public void setStart(String start) { this.start = start; }
        public String getEnd() { return end; }
        public void setEnd(String end) { this.end = end; }
    }

    // getters/setters
    public String getNetId() { return netId; }
    public void setNetId(String netId) { this.netId = netId; }

    public List<String> getSelectedSections() { return selectedSections; }
    public void setSelectedSections(List<String> selectedSections) { this.selectedSections = selectedSections; }

    public List<BlockedTime> getBlockedTimes() { return blockedTimes; }
    public void setBlockedTimes(List<BlockedTime> blockedTimes) { this.blockedTimes = blockedTimes; }

    public String getAcademicPeriodName() { return academicPeriodName; }
    public void setAcademicPeriodName(String academicPeriodName) { this.academicPeriodName = academicPeriodName; }
}