package com.courseflow.backend.CoursePlan;

import java.util.List;

public class CourseDTO {
    private int year;
    private String semester;
    private String code;
    private String name;
    private int credits;
    private boolean taken;
    private List<String> programLabels;

    public CourseDTO(){

    }

    //getters and setters
    public void setYear(int year){ this.year = year; }
    public int getYear(){ return year; }

    public void setSemester(String sem){ this.semester = sem; }
    public String getSemester(){ return semester; }

    public void setCode(String code){ this.code = code; }
    public String getCode(){ return code; }

    public void setName(String name){ this.name = name; }
    public String getName(){ return name; }

    public void setCredits(int cred){ this.credits = cred; }
    public int getCredits(){ return credits; }

    public void setTaken(boolean isTaken){ this.taken = isTaken; }
    public boolean isTaken(){ return taken; }

    public void setProgramLabels(List<String> programLabels){ this.programLabels = programLabels; }
    public List<String> getProgramLabels(){ return programLabels; }
}
