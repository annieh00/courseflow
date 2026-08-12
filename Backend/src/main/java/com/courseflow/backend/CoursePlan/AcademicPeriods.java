package com.courseflow.backend.CoursePlan;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "academic_periods")
public class AcademicPeriods {
    @Id
    @Column(name = "academic_period_id")
    private Integer id;

    private String name;

    //setters and getters
    public int getId(){ return id; }
    public void setId(int id){ this.id = id; }

    public String getName(){ return name; }
    public void setName(String name){ this.name = name; }
}
