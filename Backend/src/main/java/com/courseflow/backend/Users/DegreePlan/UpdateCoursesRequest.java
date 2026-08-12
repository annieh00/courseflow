package com.courseflow.backend.Users.DegreePlan;

import java.util.List;

public class UpdateCoursesRequest {
    private List<String> courseNumbers; // Frontend sends ["ACCT 2840", "MATH 1650"]
    private List<String> inProgressCourseNumbers; // in-progress

    public List<String> getCourseNumbers() { return courseNumbers; }
    public void setCourseNumbers(List<String> courseNumbers) { this.courseNumbers = courseNumbers; }

    public List<String> getInProgressCourseNumbers() { return inProgressCourseNumbers; }
    public void setInProgressCourseNumbers(List<String> inProgressCourseNumbers) { this.inProgressCourseNumbers = inProgressCourseNumbers; }
}