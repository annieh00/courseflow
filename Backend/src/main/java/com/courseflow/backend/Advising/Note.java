package com.courseflow.backend.advising;

public class Note {
    private String id;
    private String date;
    private String type;
    private String summary;
    private String detail;

    public Note() {}

    public Note(String id, String date, String type, String summary, String detail) {
        this.id = id;
        this.date = date;
        this.type = type;
        this.summary = summary;
        this.detail = detail;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
