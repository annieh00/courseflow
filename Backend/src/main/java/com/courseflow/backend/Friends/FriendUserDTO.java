package com.courseflow.backend.Friends;

import com.courseflow.backend.Users.Profiles.UserProfile;
import com.courseflow.backend.Users.User;

import java.util.List;

public class FriendUserDTO {
    private Long id;
    private String netid;
    private String email;
    private String name;
    private String firstName;
    private String lastName;
    private String photoUrl;
    private String bio;
    private List<String> majors;
    private List<String> minors;
    private String graduationYear;
    private String friendshipStatus;

    public FriendUserDTO(User user) {
        this(user, null);
    }

    public FriendUserDTO(User user, FriendshipStatus friendshipStatus) {
        this.id = user.getId();
        this.netid = user.getNetid();
        this.email = user.getEmail();
        this.name = user.getFullName();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.friendshipStatus = friendshipStatus == null ? null : friendshipStatus.name();

        UserProfile profile = user.getProfile();
        if (profile != null) {
            this.photoUrl = profile.getPhotoUrl();
            this.bio = profile.getBio();
            this.majors = profile.getMajors() == null ? List.of() : profile.getMajors();
            this.minors = profile.getMinors() == null ? List.of() : profile.getMinors();
            this.graduationYear = profile.getGraduationYear();
            if (profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
                this.name = profile.getDisplayName();
            }
        } else {
            this.majors = List.of();
            this.minors = List.of();
        }
    }

    public Long getId() { return id; }
    public String getNetid() { return netid; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhotoUrl() { return photoUrl; }
    public String getBio() { return bio; }
    public List<String> getMajors() { return majors; }
    public List<String> getMinors() { return minors; }
    public String getGraduationYear() { return graduationYear; }
    public String getFriendshipStatus() { return friendshipStatus; }
}
