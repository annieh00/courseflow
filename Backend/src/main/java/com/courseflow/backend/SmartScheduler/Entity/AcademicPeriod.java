package com.courseflow.backend.SmartScheduler.Entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "academic_periods")
public class AcademicPeriod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "academic_period_id")
    private Integer academicPeriodId;

    @Column(name = "name")
    private String name;

    @OneToMany(mappedBy = "academicPeriod")
    private List<Section> sections;

    // Getters and setters
    public Integer getAcademicPeriodId() { return academicPeriodId; }
    public void setAcademicPeriodId(Integer academicPeriodId) { this.academicPeriodId = academicPeriodId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Section> getSections() { return sections; }
    public void setSections(List<Section> sections) { this.sections = sections; }
}