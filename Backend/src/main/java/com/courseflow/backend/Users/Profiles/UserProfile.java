package com.courseflow.backend.Users.Profiles;

import com.courseflow.backend.Users.User;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long profile_id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonBackReference
    private User user;

    private String bio;

    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    private String displayName;
    private String graduationYear; // Good to have

    // store multiple majors
    @ElementCollection
    @CollectionTable(name = "user_profile_majors", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "major")
    private List<String> majors = new ArrayList<>();

    // store multiple minors
    @ElementCollection
    @CollectionTable(name = "user_profile_minors", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "minor")
    private List<String> minors = new ArrayList<>();

    public UserProfile() {}

    public UserProfile(User user) {
        this.user = user;
        this.displayName = user.getNetid();
        this.photoUrl="https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0=";
    }

    public Long getProfile_id() { return profile_id; }
    public User getUser() { return user; }
    public String getBio() { return bio; }
    public String getPhotoUrl() { return photoUrl; }
    public String getDisplayName() {
        return displayName;
    }
    public List<String> getMajors() { return majors; }
    public List<String> getMinors() { return minors; }
    public String getGraduationYear() { return graduationYear; }

    public void setUser(User user) { this.user = user; }
    public void setBio(String bio) { this.bio = bio; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    public void setMajors(List<String> majors) { this.majors = majors; }
    public void setMinors(List<String> minors) { this.minors = minors; }
    public void setGraduationYear(String graduationYear) { this.graduationYear = graduationYear; }

}
