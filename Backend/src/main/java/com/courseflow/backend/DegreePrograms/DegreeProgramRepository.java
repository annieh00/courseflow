package com.courseflow.backend.DegreePrograms;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DegreeProgramRepository extends JpaRepository<DegreeProgram, String> {
}