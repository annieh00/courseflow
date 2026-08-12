package com.courseflow.backend.CoursePlan;

import com.courseflow.backend.Courses.Course;
import com.courseflow.backend.CoursePlan.AcademicPeriods;
import jakarta.persistence.*;

@Entity
@Table(name = "plan_courses")
public class PlanCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "plan_id")
    private CoursePlan coursePlan;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    private int year;

    @ManyToOne
    @JoinColumn(name = "academic_period_id")
    private AcademicPeriods academicPeriod;
    private boolean taken;

    @Column(name = "program_label")
    private String programLabel;

    // getters and setters
    public void setYear(int year) {
        this.year = year;
    }

    public int getYear() {
        return year;
    }

    public void setAcademicPeriod(AcademicPeriods period) {
        this.academicPeriod = period;
    }

    public AcademicPeriods getAcademicPeriod() {
        return academicPeriod;
    }

    public void setTaken(boolean isTaken) {
        this.taken = isTaken;
    }

    public boolean isTaken() {
        return taken;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public void setCoursePlan(CoursePlan plan) {
        this.coursePlan = plan;
    }

    public String getProgramLabel() { return programLabel; }
    public void setProgramLabel(String programLabel) { this.programLabel = programLabel; }

}
