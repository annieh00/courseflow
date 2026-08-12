package com.courseflow.backend.Degrees;

import jakarta.persistence.*;
import com.courseflow.backend.Courses.*;

@Entity
@Table(name = "degree_requirements")
public class Degree {


    @Column(name = "subject")
    private String subject;

    //possibly create an int id to distinguish major and minor degree
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int unique_id;

    //major or minor degree?
    @Column(name = "degree_type")
    private String degree_type;

    @Column(name = "credits_required")
    private int credits_required;

    //default constructor
    public Degree(){

    }

    //constructor
    public Degree(String name, int creds){
        this.subject = name;
        this.credits_required = creds;
    }

    //getters and setters
    public String getSubject() { return subject;   }
    public void setSubject(String subject) { this.subject = subject;  }

    public String getDegree_type(){ return degree_type; }
    public void setDegree_type(String program){  this.degree_type= program; }

    public int getCredits_required(){ return credits_required; }
    public void setCredits_required(int credits_total){ this.credits_required = credits_total; }
}
