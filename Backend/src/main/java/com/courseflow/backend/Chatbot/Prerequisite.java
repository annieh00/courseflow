package com.courseflow.backend.Chatbot;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "prerequisites")
public class Prerequisite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id")
    private Integer courseId;

    @Column(name = "prereq_course_id")
    private Integer prereqCourseId;

    @Column(name = "requirement_type")
    private String requirementType;

    @Column(name = "logic_group_id")
    private Integer logicGroupId;

    @Column(name = "concurrent_allowed")
    private Boolean concurrentAllowed;

    // Constructors
    public Prerequisite() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getCourseId() { return courseId; }
    public void setCourseId(Integer courseId) { this.courseId = courseId; }

    public Integer getPrereqCourseId() { return prereqCourseId; }
    public void setPrereqCourseId(Integer prereqCourseId) { this.prereqCourseId = prereqCourseId; }

    public String getRequirementType() { return requirementType; }
    public void setRequirementType(String requirementType) { this.requirementType = requirementType; }

    public Integer getLogicGroupId() { return logicGroupId; }
    public void setLogicGroupId(Integer logicGroupId) { this.logicGroupId = logicGroupId; }

    public Boolean getConcurrentAllowed() { return concurrentAllowed; }
    public void setConcurrentAllowed(Boolean concurrentAllowed) { this.concurrentAllowed = concurrentAllowed; }
}