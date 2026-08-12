package com.courseflow.backend.CoursePlan;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class CoursePlanDTO {

    @JsonProperty("plan_id")
    private int plan_id;

    @JsonProperty("plan_name")
    private String plan_name;

    @JsonProperty("total_credits")
    private int total_credits;

    @JsonProperty("list_of_courses")
    private List<CourseDTO> list_of_courses;

    // constructors, getters, setters
    public CoursePlanDTO() {
        this.total_credits = 0;
    }

    public int getPlan_id() {
        return plan_id;
    }

    public void setPlan_id(int plan_id) {
        this.plan_id = plan_id;
    }

    public int getTotal_credits() {
        return total_credits;
    }

    public void setTotal_credits(int total_credits) {
        this.total_credits = total_credits;
    }

    public String getPlanName() {
        return plan_name;
    }

    public void setPlan_name(String plan_name) {
        this.plan_name = plan_name;
    }

    public List<CourseDTO> getList_of_courses() {
        return list_of_courses;
    }

    public void setList_of_courses(List<CourseDTO> list_of_courses) {
        this.list_of_courses = list_of_courses;
    }

}
