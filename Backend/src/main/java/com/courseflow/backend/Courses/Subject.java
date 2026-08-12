package com.courseflow.backend.Courses;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "subjects")
public class Subject {
    @Id
    @Column(name = "subject_id")
    private Integer id;

    @Column(name = "abbreviation")
    private String abbreviation;

    @Column(name = "name")
    private String name;

    //getters and setters
    public int getId(){ return id; }
    public void setId(int new_id){ this.id = new_id; }

    public String getAbbreviation(){ return abbreviation; }
    public void setAbbreviation(String abbrev){ this.abbreviation = abbrev; }

    public String getName(){ return name; }
    public void setName(String sub_name){ this.name = sub_name; }
}
