package com.courseflow.backend.Courses;

import jakarta.persistence.*;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Integer id;

    @Column(name = "course_number")
    private String courseNum; //equivalent to course_number in db

    @Column(name = "title")
    private String coursename; //equivalent to title in db


    @Column(name = "description", length = 2048)
    private String description; //equivalent to description in db

    @Column(name = "level")
    private String course_level; //equivalent to level in db

    @Column(name = "credits")
    private String credits;

    @ManyToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;
    /*
    @Column(name = "subject")
    private String department; // equivalent to subject in db */




    //default constructor
    public Course(){

    }
    //constructor
    public Course(String coursenum){
        this.courseNum = coursenum;
    }

   //setters and getters
    public String getcourseNum(){ return courseNum; }
    public void setcoursenum(String course_num){ this.courseNum = course_num; }

    public String getCourseName(){ return coursename; }
    public void setCoursename(String classname){ this.coursename = classname; }

    public String getDescription(){ return description; }
    public void setDescription(String desc){ this.description = desc; }

    public Subject getSubject(){ return subject; }
    public void setSubject(Subject subject){this.subject = subject; }

    public String getCourse_level() {
        return course_level;
    }
    public void setCourse_level(String lev){ this.course_level = lev; }

    public String getCredits(){ return credits; }
    public void setCredits(String cred){ this.credits = cred; }

    public int getId() {
        return id;
    }
}
