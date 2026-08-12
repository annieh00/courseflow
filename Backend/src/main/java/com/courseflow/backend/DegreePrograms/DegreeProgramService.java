package com.courseflow.backend.DegreePrograms;

import com.courseflow.backend.DegreePrograms.RequirementDetailsDTO;
import com.courseflow.backend.DegreePrograms.SectionDetailsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DegreeProgramService {

    @Autowired
    private RequirementRulesRepository rulesRepo;

    @Autowired
    private ProgramRequirementsRepository requirementsRepo;

    // Inject JdbcTemplate to run raw SQL queries easily
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DegreeProgramRepository degreeProgramRepo;

    /**
     * Requirement 1: Get the Credit Breakdown (The "Rules")
     */
    public List<RequirementRules> getDegreeManifest(String programId) {
        return rulesRepo.findByProgramId(programId);
    }

    /**
     * Requirement 2: Get ALL Classes for the Degree
     */
    public List<ProgramRequirements> getAllProgramClasses(String programId) {
        return requirementsRepo.findByProgramId(programId);
    }

    /**
     * Requirement 3: Get SPECIFIC Electives (Basic, Returns only IDs)
     */
    public List<ProgramRequirements> getElectives(String programId, String type) {
        try {
            ClassCategory category = ClassCategory.valueOf(type);
            return requirementsRepo.findByProgramIdAndRequirementType(programId, category);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid Category Type: " + type);
        }
    }

    /**
     * NEW: Get Enriched Electives (Returns full course & schedule data)
     */
    public List<RequirementDetailsDTO> getEnrichedElectives(String programId, String type) {
        // Raw SQL Query to join requirements, courses, sections, and academic periods
        String sql = """
                SELECT 
                    pr.requirement_id, pr.requirement_type, pr.min_grade, pr.course_id,
                    c.course_number, c.title AS course_title, c.credits,
                    s.section_number, s.instructors, s.locations, s.meeting_patterns, s.open_seats,
                    ap.name AS semester
                FROM program_requirements pr
                JOIN courses c ON CAST(pr.course_id AS INTEGER) = c.course_id
                LEFT JOIN sections s ON c.course_id = s.course_id
                LEFT JOIN academic_periods ap ON s.academic_period_id = ap.academic_period_id
                WHERE pr.program_id = ? AND pr.requirement_type = ?
                """;

        // Execute query and extract the results into our DTOs
        return jdbcTemplate.query(sql, rs -> {
            // Using a Map to group sections by requirementId so we don't get duplicate courses
            Map<Long, RequirementDetailsDTO> dtoMap = new LinkedHashMap<>();

            while (rs.next()) {
                Long reqId = rs.getLong("requirement_id");

                // Get the DTO if we already created it, or create a new one
                RequirementDetailsDTO dto = dtoMap.get(reqId);
                if (dto == null) {
                    dto = new RequirementDetailsDTO();
                    dto.setRequirementId(reqId);
                    dto.setRequirementType(rs.getString("requirement_type"));
                    dto.setMinGrade(rs.getString("min_grade"));
                    dto.setCourseId(rs.getString("course_id"));
                    dto.setCourseNumber(rs.getString("course_number"));
                    dto.setCourseTitle(rs.getString("course_title"));
                    dto.setCredits(rs.getString("credits"));
                    dto.setOfferedSections(new ArrayList<>());
                    dtoMap.put(reqId, dto);
                }

                // Check if there is an offered section attached to this row
                String semester = rs.getString("semester");
                if (semester != null) {
                    SectionDetailsDTO section = new SectionDetailsDTO();
                    section.setSemester(semester);
                    section.setMeetingPatterns(rs.getString("meeting_patterns"));
                    section.setOpenSeats(rs.getInt("open_seats"));

                    section.setSectionNumber(rs.getString("section_number"));
                    section.setInstructors(rs.getString("instructors"));
                    section.setLocations(rs.getString("locations"));

                    // Add section to the course's list
                    dto.getOfferedSections().add(section);
                }
            }
            return new ArrayList<>(dtoMap.values());
        }, programId, type);
    }

    /**
     * Get the degree structured by Category (ENRICHED)
     * Useful for Frontend "Accordion" views
     * Returns a Map: { "SOFTWARE_ENGINEERING_CORE": [Class A, Class B...], "GEN_ED": [...] }
     */
    public Map<String, List<RequirementDetailsDTO>> getStructuredDegree(String programId) {
        // Raw SQL to grab ALL requirements for the program and join with courses/sections
        String sql = """
                SELECT 
                    pr.requirement_id, pr.requirement_type, pr.group_id, pr.min_grade, pr.course_id,
                    c.course_number, c.title AS course_title, c.credits,
                    s.section_number, s.instructors, s.locations, s.meeting_patterns, s.open_seats,
                    ap.name AS semester
                FROM program_requirements pr
                JOIN courses c ON CAST(pr.course_id AS INTEGER) = c.course_id
                LEFT JOIN sections s ON c.course_id = s.course_id
                LEFT JOIN academic_periods ap ON s.academic_period_id = ap.academic_period_id
                WHERE pr.program_id = ?
                """;

        // 1. Fetch and map all rows into our DTOs
        List<RequirementDetailsDTO> allEnrichedReqs = jdbcTemplate.query(sql, rs -> {
            Map<Long, RequirementDetailsDTO> dtoMap = new java.util.LinkedHashMap<>();

            while (rs.next()) {
                Long reqId = rs.getLong("requirement_id");

                RequirementDetailsDTO dto = dtoMap.get(reqId);
                if (dto == null) {
                    dto = new RequirementDetailsDTO();
                    dto.setRequirementId(reqId);
                    dto.setRequirementType(rs.getString("requirement_type"));
                    dto.setGroupId(rs.getString("group_id")); // Now included!
                    dto.setMinGrade(rs.getString("min_grade"));
                    dto.setCourseId(rs.getString("course_id"));
                    dto.setCourseNumber(rs.getString("course_number"));
                    dto.setCourseTitle(rs.getString("course_title"));
                    dto.setCredits(rs.getString("credits"));
                    dto.setOfferedSections(new ArrayList<>());
                    dtoMap.put(reqId, dto);
                }

                // Append section if one exists
                String semester = rs.getString("semester");
                if (semester != null) {
                    SectionDetailsDTO section = new SectionDetailsDTO();
                    section.setSemester(semester);
                    section.setMeetingPatterns(rs.getString("meeting_patterns"));
                    section.setOpenSeats(rs.getInt("open_seats"));

                    section.setSectionNumber(rs.getString("section_number"));
                    section.setInstructors(rs.getString("instructors"));
                    section.setLocations(rs.getString("locations"));

                    dto.getOfferedSections().add(section);
                }
            }
            return new ArrayList<>(dtoMap.values());
        }, programId);

        // 2. Group the flat list by the requirementType (e.g., "GENERAL_EDUCATION")
        if (allEnrichedReqs == null || allEnrichedReqs.isEmpty()) {
            return java.util.Collections.emptyMap();
        }

        return allEnrichedReqs.stream()
                .collect(Collectors.groupingBy(RequirementDetailsDTO::getRequirementType));
    }

    /**
     * Get all unique degree programs available in the database (DYNAMIC)
     */
    public List<DegreeOptionDTO> getAvailablePrograms() {
        // Fetch all the programs directly from our new database table!
        List<DegreeProgram> programs = degreeProgramRepo.findAll();

        // Map them to the DTO your frontend expects
        return programs.stream().map(program -> {
            return new DegreeOptionDTO(
                    program.getProgramId(),
                    program.getName(),
                    program.getDegreeType()
            );
        }).collect(Collectors.toList());
    }
}