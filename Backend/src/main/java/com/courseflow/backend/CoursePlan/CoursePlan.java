package com.courseflow.backend.CoursePlan;

import com.courseflow.backend.Users.User;
import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "user_course_plan")
public class CoursePlan { // variables
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int planId;

    private String planName;
    private int total_credits;

    // @OneToMany(mappedBy = "coursePlan", cascade = CascadeType.ALL)
    // private List<PlanCourse> planCourses = new ArrayList<>();

    // Made this change to be able to delete specific rows in database
    // FIX 1: Added orphanRemoval = true
    @OneToMany(mappedBy = "coursePlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlanCourse> planCourses = new ArrayList<>();

    @ManyToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "netid")
    private User user;

    // default constructor
    // public CoursePlan(){ }

    public CoursePlan() {
        // this.planCourses = new ArrayList<>();
        this.total_credits = 0;
    }

    // getters and setters
    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String name) {
        this.planName = name;
    }

    public int getId() {
        return planId;
    }

    public void setId(int id) {
        this.planId = id;
    }

    public int getTotal_credits() {
        return total_credits;
    }

    // public void setTotal_credits(int cred) {
    // total_credits += cred;
    // }

    // FIX 2: Changed to a standard setter.
    // Perform the math (addition/subtraction) in your Controller instead.
    public void setTotal_credits(int total_credits) {
        this.total_credits = total_credits;
    }

    public List<PlanCourse> getPlanCourses() {
        return planCourses;
    }

    public User getUser() { return user; }

    public void setUser(User user) {
        this.user = user;
    }

    // public List<String> getListOfCourses() {
    // return listOfCourses;
    // }
    // public void setListOfCourses(String course) {
    // listOfCourses.add(course);
    // }
    // public void removeCourse(String course){
    // listOfCourses.remove(course);
    // }
}
