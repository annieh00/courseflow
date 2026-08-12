package com.courseflow.backend.SmartScheduler.Entity;

import jakarta.persistence.*;
@Entity
@Table(name = "section_professors")
public class SectionProfessor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "section_professor_id")
    private Long sectionProfessorId;

    @Column(name = "section_id")
    private Integer sectionId;

    @Column(name = "name")
    private String name;

    @ManyToOne
    @JoinColumn(name = "section_id", insertable = false, updatable = false)
    private Section section;

    // Getters and setters
    public Long getSectionProfessorId() { return sectionProfessorId; }
    public void setSectionProfessorId(Long sectionProfessorId) { this.sectionProfessorId = sectionProfessorId; }

    public Integer getSectionId() { return sectionId; }
    public void setSectionId(Integer sectionId) { this.sectionId = sectionId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Section getSection() { return section; }
    public void setSection(Section section) { this.section = section; }
}