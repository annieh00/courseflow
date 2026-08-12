package com.courseflow.backend.SmartScheduler.Entity;

import com.courseflow.backend.Courses.Course;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "sections")
public class Section {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "section_id")
    private Integer sectionId;

    @Column(name = "course_id")
    private Integer courseId;

    @Column(name = "academic_period_id")
    private Integer academicPeriodId;

    @Column(name = "section_number")
    private String sectionNumber;

    @Column(name = "open_seats")
    private Integer openSeats;

    @Column(name = "meeting_patterns", columnDefinition = "TEXT")
    private String meetingPatterns;

    @ManyToOne
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "academic_period_id", insertable = false, updatable = false)
    private AcademicPeriod academicPeriod;

    @OneToMany(mappedBy = "section")
    private List<SectionProfessor> sectionProfessors;

    // Getters and setters
    public Integer getSectionId() { return sectionId; }
    public void setSectionId(Integer sectionId) { this.sectionId = sectionId; }

    public Integer getCourseId() { return courseId; }
    public void setCourseId(Integer courseId) { this.courseId = courseId; }

    public Integer getAcademicPeriodId() { return academicPeriodId; }
    public void setAcademicPeriodId(Integer academicPeriodId) { this.academicPeriodId = academicPeriodId; }

    public String getSectionNumber() { return sectionNumber; }
    public void setSectionNumber(String sectionNumber) { this.sectionNumber = sectionNumber; }

    public Integer getOpenSeats() { return openSeats; }
    public void setOpenSeats(Integer openSeats) { this.openSeats = openSeats; }

    public String getMeetingPatterns() { return meetingPatterns; }
    public void setMeetingPatterns(String meetingPatterns) { this.meetingPatterns = meetingPatterns; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public AcademicPeriod getAcademicPeriod() { return academicPeriod; }
    public void setAcademicPeriod(AcademicPeriod academicPeriod) { this.academicPeriod = academicPeriod; }

    public List<SectionProfessor> getSectionProfessors() { return sectionProfessors; }
    public void setSectionProfessors(List<SectionProfessor> sectionProfessors) { this.sectionProfessors = sectionProfessors; }
}