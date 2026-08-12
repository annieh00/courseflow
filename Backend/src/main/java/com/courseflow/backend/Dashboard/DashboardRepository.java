package com.courseflow.backend.Dashboard;

import com.courseflow.backend.Degrees.Degree;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface DashboardRepository extends JpaRepository<UserDegreePlan, Long> {

    Optional<UserDegreePlan> findByUserId(Long userId);

    @Query("SELECT d FROM Degree d WHERE d.degree_type = :degreeType")
    List<Degree> findRequirementsByDegreeType(@Param("degreeType") String degreeType);
}
