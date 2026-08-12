package com.courseflow.backend.Advisors;

public class CreateNoteRequest {
    private String advisorNetid;
    private String studentNetid;
    private String content;
    private String noteType; // optional

    public CreateNoteRequest() {}

    public String getAdvisorNetid() { return advisorNetid; }
    public void setAdvisorNetid(String advisorNetid) { this.advisorNetid = advisorNetid; }

    public String getStudentNetid() { return studentNetid; }
    public void setStudentNetid(String studentNetid) { this.studentNetid = studentNetid; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getNoteType() { return noteType; }
    public void setNoteType(String noteType) { this.noteType = noteType; }
}