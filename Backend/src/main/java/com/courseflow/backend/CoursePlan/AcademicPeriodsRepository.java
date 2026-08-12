package com.courseflow.backend.CoursePlan;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AcademicPeriodsRepository extends JpaRepository<AcademicPeriods, Integer>{

    Optional<AcademicPeriods> findByNameContaining(String name);
}
