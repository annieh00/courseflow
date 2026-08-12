package com.courseflow.backend.Users.DegreePlan;

import com.courseflow.backend.DegreePrograms.DegreeType;

public class CreatePlanRequest {
    private String programId;     // e.g., "SE"
    private DegreeType degreeType; // e.g., MAJOR

    public String getProgramId() { return programId; }
    public void setProgramId(String programId) { this.programId = programId; }

    public DegreeType getDegreeType() { return degreeType; }
    public void setDegreeType(DegreeType degreeType) { this.degreeType = degreeType; }
}
