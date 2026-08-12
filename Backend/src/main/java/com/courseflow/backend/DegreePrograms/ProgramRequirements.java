package com.courseflow.backend.DegreePrograms;

import jakarta.persistence.*;

@Entity
@Table(name = "program_requirements")
public class ProgramRequirements {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "requirement_id")
    private Long requirementId;

    @Column(name = "course_id")
    private int courseId;

    @Column(name = "program_id")
    private String programId;

    @Enumerated(EnumType.STRING)
    @Column(name = "requirement_type")
    private ClassCategory requirementType;

    @Enumerated(EnumType.STRING)
    @Column(name = "group_id")
    private RequirementGroup groupId;

    @Column(name = "min_grade")
    private String minGrade;   // NEED TO CREATE A LOOK UP TABLE
    /*
    If we store the min_grade as "B" we will have no way of doing math computations on the letter grade itself.
    we need to use a look up table to be able to preform computations
    ex; a 'B' grade will map to 3.0, an 'A-' grade will map to 3.7
     */

    public Long getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(Long requirementId) {
        this.requirementId = requirementId;
    }

    public int getCourseId() {
        return courseId;
    }

    public void setCourseId(int courseId) {
        this.courseId = courseId;
    }

    public String getProgramId() {
        return programId;
    }

    public void setProgramId(String programId) {
        this.programId = programId;
    }

    public ClassCategory getRequirementType() {
        return requirementType;
    }

    public void setRequirementType(ClassCategory requirementType) {
        this.requirementType = requirementType;
    }

    public RequirementGroup getGroupId() {
        return groupId;
    }

    public void setGroupId(RequirementGroup groupId) {
        this.groupId = groupId;
    }

    public String getMinGrade() {
        return minGrade;
    }

    public void setMinGrade(String minGrade) {
        this.minGrade = minGrade;
    }
}