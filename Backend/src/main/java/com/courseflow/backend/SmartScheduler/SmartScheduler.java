package com.courseflow.backend.SmartScheduler;

import com.courseflow.backend.Courses.Course;
import com.courseflow.backend.SmartScheduler.Entity.AcademicPeriod;
import com.courseflow.backend.SmartScheduler.Entity.Section;
import com.courseflow.backend.SmartScheduler.Entity.SectionProfessor;
import com.courseflow.backend.SmartScheduler.CourseResponseDTO.SectionDTO;
import com.courseflow.backend.SmartScheduler.CourseResponseDTO.MeetingDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SmartScheduler {

    @Autowired
    private SmartSchedulerRepository smartSchedulerRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private AcademicPeriodRepository academicPeriodRepository;

    public List<CourseResponseDTO> searchCourses(String searchTerm, String academicPeriodName) {
        if (academicPeriodName == null || academicPeriodName.trim().isEmpty()) {
            throw new IllegalArgumentException("academicPeriod is required");
        }
        AcademicPeriod period = academicPeriodRepository.findByName(academicPeriodName.trim())
                .orElseThrow(() -> new RuntimeException("Academic period not found: " + academicPeriodName));
        Integer academicPeriodId = period.getAcademicPeriodId();

        List<Course> courses = (searchTerm == null || searchTerm.trim().isEmpty())
                ? new ArrayList<>()
                : smartSchedulerRepository.searchCourses(searchTerm.trim());

        return courses.stream()
                .map(course -> convertToDTO(course, academicPeriodId))
                .collect(Collectors.toList());
    }
    public Map<String, List<SectionDTO>> getSectionsForCourses(
            List<String> courseNumbers,
            Integer academicPeriodId
    ) {
        Map<String, List<SectionDTO>> result = new HashMap<>();

        for (String courseNumber : courseNumbers) {

            List<Section> sections =
                    sectionRepository.findByCourseNumber(courseNumber, academicPeriodId);

            List<SectionDTO> dtoList = sections.stream()
                    .map(this::convertToSectionDTO)
                    .collect(Collectors.toList());

            result.put(courseNumber, dtoList);
        }

        return result;
    }

    private CourseResponseDTO convertToDTO(Course course, Integer academicPeriodId) {
        List<Section> sections = sectionRepository.findByCourseIdAndAcademicPeriod(course.getId(), academicPeriodId);
        List<SectionDTO> sectionDTOs = sections.stream()
                .map(this::convertToSectionDTO)
                .collect(Collectors.toList());

        return new CourseResponseDTO(
                course.getId(),
                course.getcourseNum(),
                course.getCourseName(),
                course.getSubject() != null ? course.getSubject().getName() : "N/A",
                course.getCredits() != null ? course.getCredits() : "N/A",
                sectionDTOs
        );
    }

    private SectionDTO convertToSectionDTO(Section section) {
        String instructor = "N/A";
        if (section.getSectionProfessors() != null && !section.getSectionProfessors().isEmpty()) {
            SectionProfessor sp = section.getSectionProfessors().get(0);
            if (sp.getName() != null && !sp.getName().trim().isEmpty()) {
                instructor = sp.getName();
            }
        }

        List<MeetingDTO> meetings = parseMeetingPatterns(section.getMeetingPatterns());

        return new SectionDTO(
                section.getSectionId(),
                instructor,
                section.getSectionNumber(),
                section.getOpenSeats() != null ? section.getOpenSeats() : 0,
                meetings
        );
    }

    private List<MeetingDTO> parseMeetingPatterns(String meetingPatterns) {
        List<MeetingDTO> meetings = new ArrayList<>();
        if (meetingPatterns == null || meetingPatterns.trim().isEmpty()) {
            meetings.add(new MeetingDTO("N/A", "N/A", "N/A"));
            return meetings;
        }

        String[] patterns = meetingPatterns.split(";");
        for (String pattern : patterns) {
            pattern = pattern.trim();
            if (pattern.isEmpty()) continue;

            String[] parts = pattern.split("\\|");
            if (parts.length != 2) continue;

            String daysPart = parts[0].trim();
            String[] timeParts = parts[1].trim().split("-");
            if (timeParts.length != 2) continue;

            String startTime = timeParts[0].trim();
            String endTime = timeParts[1].trim();

            for (char dayChar : daysPart.toCharArray()) {
                String day = convertDayChar(dayChar);
                if (day != null) {
                    meetings.add(new MeetingDTO(day, startTime, endTime));
                }
            }
        }
        return meetings.isEmpty() ? List.of(new MeetingDTO("N/A", "N/A", "N/A")) : meetings;
    }

    private String convertDayChar(char dayChar) {
        switch (dayChar) {
            case 'M': return "Mon";
            case 'T': return "Tue";
            case 'W': return "Wed";
            case 'R': return "Thu";
            case 'F': return "Fri";
            default: return null;
        }
    }
}