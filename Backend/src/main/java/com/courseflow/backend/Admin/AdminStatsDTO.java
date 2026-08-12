package com.courseflow.backend.Admin;

public class AdminStatsDTO {

    private long totalUsers;
    private long totalStudents;
    private long totalAdvisors;
    private long totalAdmins;
    private long totalCourses;
    private long pendingAdminApprovals;
    private long pendingAdvisorApprovals;

    //constructor
    public AdminStatsDTO(long totalUsers, long totalStudents, long totalAdvisors, long totalAdmins, long totalCourses, long pendingAdminApprovals, long pendingAdvisorApprovals){
        this.totalUsers = totalUsers;
        this.totalStudents = totalStudents;
        this.totalAdvisors = totalAdvisors;
        this.totalAdmins = totalAdmins;
        this.totalCourses = totalCourses;
        this.pendingAdminApprovals = pendingAdminApprovals;
        this.pendingAdvisorApprovals = pendingAdvisorApprovals;
    }

    //getters and setters
    public long getTotalUsers(){
        return totalUsers;
    }

    public long getTotalStudents(){
        return totalStudents;
    }

    public long getTotalAdvisors(){
        return totalAdvisors;
    }

    public long getTotalAdmins(){
        return totalAdmins;
    }

    public long getTotalCourses(){
        return totalCourses;
    }

    public long getPendingAdminApprovals() {
        return pendingAdminApprovals;
    }

    public long getPendingAdvisorApprovals() {
        return pendingAdvisorApprovals;
    }
}
