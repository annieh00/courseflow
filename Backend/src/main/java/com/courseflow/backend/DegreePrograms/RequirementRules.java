package com.courseflow.backend.DegreePrograms;

import jakarta.persistence.*;

@Entity
@Table(name = "requirement_rules")
public class RequirementRules {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rule_id")
    private Long ruleId;

    @Column(name = "program_id")
    private String programId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_name")
    private ClassCategory categoryName; // ex : SE CORE

    @Enumerated(EnumType.STRING)
    @Column(name = "group_id")
    private RequirementGroup groupId;

    @Column(name = "required_credits")
    private int requiredCredits;

    @Column(name = "min_gpa")
    private Float minGpa;

    public Long getRuleId() {
        return ruleId;
    }

    public void setRuleId(Long ruleId) {
        this.ruleId = ruleId;
    }

    public String getProgramId() {
        return programId;
    }

    public void setProgramId(String programId) {
        this.programId = programId;
    }

    public ClassCategory getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(ClassCategory categoryName) {
        this.categoryName = categoryName;
    }

    public RequirementGroup getGroupId() {
        return groupId;
    }

    public void setGroupId(RequirementGroup groupId) {
        this.groupId = groupId;
    }

    public int getRequiredCredits() {
        return requiredCredits;
    }

    public void setRequiredCredits(int requiredCredits) {
        this.requiredCredits = requiredCredits;
    }

    public Float getMinGpa() {
        return minGpa;
    }

    public void setMinGpa(Float minGpa) {
        this.minGpa = minGpa;
    }
}