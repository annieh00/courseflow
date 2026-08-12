package com.courseflow.backend.DegreePrograms;

import com.courseflow.backend.DegreePrograms.ClassCategory;
import com.courseflow.backend.DegreePrograms.ProgramRequirements;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProgramRequirementsRepository extends JpaRepository<ProgramRequirements, Long> {

    // 1. Get ALL requirements for a major (e.g., everything for "SE")
    List<ProgramRequirements> findByProgramId(String programId);

    // 2. Get specific categories (e.g., just "SOFTWARE_ENGINEERING_ELECTIVE")
    List<ProgramRequirements> findByProgramIdAndRequirementType(String programId, ClassCategory type);

    // 3. Get courses for a specific "Choice" group (e.g., "SE_ECON_CHOICE")
    // Note: We search by Group ID (Enum) here
    List<ProgramRequirements> findByProgramIdAndGroupId(String programId, com.courseflow.backend.DegreePrograms.RequirementGroup groupId);

    // 4. Find all programs a given course satisfies, limited to the student's declared program set
    List<ProgramRequirements> findByCourseIdAndProgramIdIn(int courseId, List<String> programIds);
}