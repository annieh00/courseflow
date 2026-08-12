package com.courseflow.backend.Chatbot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrerequisiteRepository extends JpaRepository<Prerequisite, Long> {

    /**
     * Find all prerequisites for a given course
     */
    List<Prerequisite> findByCourseId(Integer courseId);

    /**
     * Find prerequisites for a course, ordered by logic group
     */
    @Query("SELECT p FROM Prerequisite p WHERE p.courseId = :courseId ORDER BY p.logicGroupId")
    List<Prerequisite> findByCourseIdOrderByLogicGroupId(@Param("courseId") Integer courseId);

    /**
     * Find all courses that have prerequisites
     */
    @Query("SELECT DISTINCT p.courseId FROM Prerequisite p")
    List<Integer> findAllCoursesWithPrerequisites();

    /**
     * Check if a course has any prerequisites
     */
    boolean existsByCourseId(Integer courseId);
}