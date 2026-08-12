package com.courseflow.backend.DegreePrograms;

import com.courseflow.backend.DegreePrograms.RequirementRules;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RequirementRulesRepository extends JpaRepository<RequirementRules, Long> {

    // Get the "Checklist" for a specific major (e.g., "SE")
    // This will return your list of 14 rules (Basic Program, Core, Gen Ed, etc.)
    List<RequirementRules> findByProgramId(String programId);
}