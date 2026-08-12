package com.courseflow.backend.Users.Profiles;

import java.util.List;

public class UserProfileResponseDTO {
    private String bio;
    private String photoUrl;
    private String displayName;
    private String name;
    private String email;
    private String netid;
    private List<String> majors;
    private List<String> minors;
    private String graduationYear;

    public UserProfileResponseDTO(UserProfile profile) {
        this.bio = profile.getBio();
        this.photoUrl = profile.getPhotoUrl();

        this.displayName = profile.getDisplayName() != null
                ? profile.getDisplayName()
                : (profile.getUser() != null ? profile.getUser().getFullName() : null);

        this.majors = profile.getMajors() != null ? profile.getMajors() : List.of();
        this.minors = profile.getMinors() != null ? profile.getMinors() : List.of();
        this.graduationYear = profile.getGraduationYear();

        if (profile.getUser() != null) {
            this.name = profile.getUser().getFullName();
            this.email = profile.getUser().getEmail();
            this.netid = profile.getUser().getNetid();
        }
    }

    public String getBio() { return bio; }
    public String getPhotoUrl() { return photoUrl; }
    public String getDisplayName() { return displayName; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getNetid() { return netid; }
    public List<String> getMajors() { return majors; }
    public List<String> getMinors() { return minors; }
    public String getGraduationYear() { return graduationYear; }

    public void setMajors(List<String> majors) { this.majors = majors; }
    public void setMinors(List<String> minors) { this.minors = minors; }
}