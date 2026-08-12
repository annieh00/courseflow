package com.courseflow.backend.Courses;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {
    List<Course> findAll();

    @Query("SELECT c FROM Course c JOIN c.subject s WHERE "
            + "(:subjectAbbrev is NULL OR s.abbreviation = :subjectAbbrev) AND " +
            "(:courseNum IS NULL OR c.courseNum LIKE %:courseNum%) AND " +
            "(:level IS NULL OR c.course_level = :level)")
    List<Course> searchCourses(@Param("subjectAbbrev") String subjectAbbrev,
            @Param("courseNum") String courseNum,
            @Param("level") String level);

    // @Query("SELECT c FROM Course c WHERE c.course_number = ?1")
    Optional<Course> findByCourseNum(String courseNum);

    Optional<Course> findById(int id);

    Course save(Course course);

    @Transactional
    void deleteById(int id);

}
