package com.courseflow.backend.Dashboard;

public class DashboardDTO {
    private String programId;
    private String degreeType;
    private int totalCreditsRequired;
    private int totalCreditsCompleted;
    private double progressPercentage;

    public DashboardDTO() {}

    public DashboardDTO(String programId, String degreeType, int totalCreditsRequired,
                        int totalCreditsCompleted, double progressPercentage) {
        this.programId = programId;
        this.degreeType = degreeType;
        this.totalCreditsRequired = totalCreditsRequired;
        this.totalCreditsCompleted = totalCreditsCompleted;
        this.progressPercentage = progressPercentage;
    }

    // Getters and setters
    public String getProgramId() { return programId; }
    public void setProgramId(String programId) { this.programId = programId; }

    public String getDegreeType() { return degreeType; }
    public void setDegreeType(String degreeType) { this.degreeType = degreeType; }

    public int getTotalCreditsRequired() { return totalCreditsRequired; }
    public void setTotalCreditsRequired(int totalCreditsRequired) {
        this.totalCreditsRequired = totalCreditsRequired;
    }

    public int getTotalCreditsCompleted() { return totalCreditsCompleted; }
    public void setTotalCreditsCompleted(int totalCreditsCompleted) {
        this.totalCreditsCompleted = totalCreditsCompleted;
    }

    public double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(double progressPercentage) {
        this.progressPercentage = progressPercentage;
    }
}