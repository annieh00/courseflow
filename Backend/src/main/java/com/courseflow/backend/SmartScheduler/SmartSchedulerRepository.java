package com.courseflow.backend.SmartScheduler;

import com.courseflow.backend.Courses.Course;  // Import the existing Course entity
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SmartSchedulerRepository extends JpaRepository<Course, Long> {

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.subject s " +
            "WHERE LOWER(c.courseNum) LIKE LOWER(CONCAT(:searchTerm, '%')) " +
            "OR LOWER(s.abbreviation) LIKE LOWER(CONCAT(:searchTerm, '%'))")
    List<Course> searchCourses(@Param("searchTerm") String searchTerm);
}