//clean up to take not null

package com.courseflow.backend.RateMyProfessor;

import jakarta.persistence.*;

@Entity
@Table(name = "professors")
public class RateMyProfessorEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Your internal DB ID

    // From TypeScript API (GraphQL)
    private String rmpId;
    private Long legacyId;
    private String firstName;
    private String lastName;
    private String department;
    private Double avgRating;
    private Double avgDifficulty;
    private Integer numRatings;
    private Integer wouldTakeAgainPercent;
    private Boolean isSaved;
    private String typename;

    // School from node.school objct
    private String schoolId;
    private String schoolName;
    private String rmpLink;

    // Default constructor
    public RateMyProfessorEntity() {}

    // Constructor for TypeScript API data
    public RateMyProfessorEntity(String rmpId, Long legacyId, String firstName,
                                 String lastName, String department, Double avgRating,
                                 Double avgDifficulty, Integer numRatings,
                                 Integer wouldTakeAgainPercent, Boolean isSaved,
                                 String typename, String schoolId, String schoolName) {
        this.rmpId = rmpId;
        this.legacyId = legacyId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.department = department;
        this.avgRating = avgRating;
        this.avgDifficulty = avgDifficulty;
        this.numRatings = numRatings;
        this.wouldTakeAgainPercent = wouldTakeAgainPercent;
        this.isSaved = isSaved;
        this.typename = typename;
        this.schoolId = schoolId;
        this.schoolName = schoolName;
        this.rmpLink = legacyId != null ? "https://www.ratemyprofessors.com/professor/" + legacyId : null;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRmpId() { return rmpId; }
    public void setRmpId(String rmpId) { this.rmpId = rmpId; }

    public Long getLegacyId() { return legacyId; }
    public void setLegacyId(Long legacyId) { this.legacyId = legacyId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Double getAvgRating() { return avgRating; }
    public void setAvgRating(Double avgRating) { this.avgRating = avgRating; }

    public Double getAvgDifficulty() { return avgDifficulty; }
    public void setAvgDifficulty(Double avgDifficulty) { this.avgDifficulty = avgDifficulty; }

    public Integer getNumRatings() { return numRatings; }
    public void setNumRatings(Integer numRatings) { this.numRatings = numRatings; }

    public Integer getWouldTakeAgainPercent() { return wouldTakeAgainPercent; }
    public void setWouldTakeAgainPercent(Integer wouldTakeAgainPercent) { this.wouldTakeAgainPercent = wouldTakeAgainPercent; }

    public Boolean getIsSaved() { return isSaved; }
    public void setIsSaved(Boolean isSaved) { this.isSaved = isSaved; }

    public String get__typename() { return typename; }
    public void set__typename(String __typename) { this.typename = typename; }

    public String getSchoolId() { return schoolId; }
    public void setSchoolId(String schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public String getRmpLink() { return rmpLink; }
    public void setRmpLink(String rmpLink) { this.rmpLink = rmpLink; }
}