// DegreeProgram.java
package com.courseflow.backend.DegreePrograms;

import jakarta.persistence.*;

@Entity
@Table(name = "degree_programs")
public class DegreeProgram {

    @Id
    @Column(name = "program_id", length = 50, nullable = false)
    private String programId;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "degree_type", nullable = false)
    private DegreeType degreeType;

    @Column(name = "department")
    private String department;

    // Default constructor required by JPA
    public DegreeProgram() {}

    public DegreeProgram(String programId, String name, DegreeType degreeType, String department) {
        this.programId = programId;
        this.name = name;
        this.degreeType = degreeType;
        this.department = department;
    }

    public String getProgramId() { return programId; }
    public void setProgramId(String programId) { this.programId = programId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public DegreeType getDegreeType() { return degreeType; }
    public void setDegreeType(DegreeType degreeType) { this.degreeType = degreeType; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}