package com.courseflow.backend.Users;

import com.courseflow.backend.Users.DegreePlan.UserDegreePlan;
import com.courseflow.backend.Users.Profiles.UserProfile;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@JsonIgnoreProperties({
        "advisorAdvisees",
        "notes",
        "hibernateLazyInitializer",
        "handler"
})
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "google_id", unique = true, nullable = false)
    private String googleId;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "netid", unique = true, nullable = false)
    private String netid;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "is_onboarded", nullable = false)
    private boolean onboarded = false;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonManagedReference
    private UserProfile profile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserDegreePlan> degreePlans = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_completed_courses", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "course_id")
    private Set<String> completedCourseIds = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "user_in_progress_courses", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "course_id")
    private Set<String> inProgressCourseIds = new HashSet<>();

    public Set<String> getInProgressCourseIds() {
        return inProgressCourseIds;
    }

    public void setInProgressCourseIds(Set<String> inProgressCourseIds) {
        this.inProgressCourseIds = inProgressCourseIds;
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private AccountLevel role; //user's current role

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserApprovalStatus status = UserApprovalStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_role")
    private AccountLevel requestedRole; //this is null unless PENDING status

    @ElementCollection
    @CollectionTable(name = "user_refresh_tokens", joinColumns = @JoinColumn(name = "user_id"))
    @MapKeyColumn(name = "device_id")
    @Column(name = "refresh_token")
    private Map<String, String> refreshTokens = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "user_refresh_tokens", joinColumns = @JoinColumn(name = "user_id"))
    @MapKeyColumn(name = "device_id")
    @Column(name = "expiry_date")
    private Map<String, LocalDateTime> refreshTokenExpiries = new HashMap<>();

    public User() {}

    public User(String googleId, String email, String netid, String fullName, String firstName, String lastName) {
        this.googleId = googleId;
        this.email = email;
        this.netid = netid;
        this.fullName = fullName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.onboarded = false;
        this.role = AccountLevel.STUDENT;

    }

    // --- Getters & Setters ---

    public Long getId() { return id; }

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNetid() { return netid; }
    public void setNetid(String netid) { this.netid = netid; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public boolean isOnboarded() { return onboarded; }
    public void setOnboarded(boolean onboarded) { this.onboarded = onboarded; }

    public UserProfile getProfile() { return profile; }
    public void setProfile(UserProfile profile) { this.profile = profile; }

    public Map<String, String> getRefreshTokens() { return refreshTokens; }
    public void setRefreshTokens(Map<String, String> refreshTokens) { this.refreshTokens = refreshTokens; }

    public Map<String, LocalDateTime> getRefreshTokenExpiries() { return refreshTokenExpiries; }
    public void setRefreshTokenExpiries(Map<String, LocalDateTime> refreshTokenExpiries) { this.refreshTokenExpiries = refreshTokenExpiries; }

    public AccountLevel getAccountLevel() {
        return role;
    }

    public void setAccountLevel(AccountLevel accountLevel) {
        this.role = accountLevel;
    }

    public String getNetId() {return netid;}

    public List<String> getMajors() {
        if (this.profile == null) {
            return new ArrayList<>();
        }
        return this.profile.getMajors();
    }

    public List<String> getMinors() {
        if (this.profile == null) {
            return new ArrayList<>();
        }
        return this.profile.getMinors();
    }

    public UserApprovalStatus getStatus(){
        return status;
    }
    public void setStatus(UserApprovalStatus status) {
        this.status = status;
    }

    public AccountLevel getRequestedRole() {
        return requestedRole;
    }

    public void setRequestedRole(AccountLevel requestedRole) {
        this.requestedRole = requestedRole;
    }
    public List<UserDegreePlan> getDegreePlans() { return degreePlans; }
    public void setDegreePlans(List<UserDegreePlan> degreePlans) { this.degreePlans = degreePlans; }

    public Set<String> getCompletedCourseIds() { return completedCourseIds; }
    public void setCompletedCourseIds(Set<String> completedCourseIds) { this.completedCourseIds = completedCourseIds; }

}