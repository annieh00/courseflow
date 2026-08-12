package com.courseflow.backend.Settings;
import com.courseflow.backend.Users.User;

import jakarta.persistence.*;

@Entity
@Table(name = "Settings")
public class Settings {
    @Id
    @Column(name = "netid", nullable = false, length = 50)
    private String netId;

    @Column(name = "dark_mode")
    private boolean darkMode = false;

    @Column(name = "notifications_enabled")
    private boolean notificationsEnabled = true;

    @Column(name = "course_reminders")
    private boolean courseReminders = true;

    @Column(name = "friend_activity_notifications")
    private boolean friendActivityNotifications = true;

    @Column(name = "profile_visible")
    private boolean profileVisible = true;

    //Constructors
    public Settings() {
        // Default constructor
    }
    public Settings(String netId) {
        this.netId = netId;
    }

    // Getters
    public String getNetId() {return netId;}
    public boolean isDarkMode() {return darkMode;}
    public boolean isNotificationsEnabled() {return notificationsEnabled;}
    public boolean isCourseReminders() {return courseReminders;}
    public boolean isFriendActivityNotifications() {return friendActivityNotifications;}
    public boolean isProfileVisible() {return profileVisible;}

    // Setters
    public void setNetId(String netId) {this.netId = netId;}
    public void setDarkMode(boolean darkMode) {this.darkMode = darkMode;}
    public void setNotificationsEnabled(boolean notificationsEnabled) {this.notificationsEnabled = notificationsEnabled;}
    public void setCourseReminders(boolean courseReminders) {this.courseReminders = courseReminders;}
    public void setFriendActivityNotifications(boolean friendActivityNotifications) {this.friendActivityNotifications = friendActivityNotifications;}
    public void setProfileVisible(boolean profileVisible) {this.profileVisible = profileVisible;}
}