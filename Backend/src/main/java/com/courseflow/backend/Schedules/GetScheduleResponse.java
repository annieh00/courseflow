package com.courseflow.backend.Schedules;

import java.util.List;

public class GetScheduleResponse {
    private List<String> selectedSections;
    private List<BlockedTime> blockedTimes;
    private List<Integer> bookmarkedScheduleIndexes;

    public static class BlockedTime {
        private String day;
        private String start;
        private String end;

        // Getters and setters
        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }
        public String getStart() { return start; }
        public void setStart(String start) { this.start = start; }
        public String getEnd() { return end; }
        public void setEnd(String end) { this.end = end; }
    }

    // Getters and setters
    public List<String> getSelectedSections() { return selectedSections; }
    public void setSelectedSections(List<String> selectedSections) { this.selectedSections = selectedSections; }

    public List<BlockedTime> getBlockedTimes() { return blockedTimes; }
    public void setBlockedTimes(List<BlockedTime> blockedTimes) { this.blockedTimes = blockedTimes; }

    public List<Integer> getBookmarkedScheduleIndexes() { return bookmarkedScheduleIndexes; }
    public void setBookmarkedScheduleIndexes(List<Integer> bookmarkedScheduleIndexes) { this.bookmarkedScheduleIndexes = bookmarkedScheduleIndexes; }
}