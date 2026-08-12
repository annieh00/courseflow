package com.courseflow.backend.SmartScheduler;

import com.courseflow.backend.SmartScheduler.Entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SectionRepository extends JpaRepository<Section, Integer> {

    @Query("SELECT s FROM Section s " +
            "LEFT JOIN FETCH s.sectionProfessors sp " +
            "WHERE s.courseId = :courseId " +
            "AND s.academicPeriod.academicPeriodId = :academicPeriodId")
    List<Section> findByCourseIdAndAcademicPeriod(
            @Param("courseId") Integer courseId,
            @Param("academicPeriodId") Integer academicPeriodId
    );

    @Query("SELECT s FROM Section s " +
            "LEFT JOIN FETCH s.sectionProfessors sp " +
            "WHERE s.course.courseNum = :courseNumber " +
            "AND s.sectionNumber = :sectionNumber " +
            "AND s.academicPeriod.academicPeriodId = :academicPeriodId")
    Optional<Section> findByCourseNumberAndSectionNumberAndAcademicPeriod(
            @Param("courseNumber") String courseNumber,
            @Param("sectionNumber") String sectionNumber,
            @Param("academicPeriodId") Integer academicPeriodId
    );

    @Query("SELECT s FROM Section s " +
            "LEFT JOIN FETCH s.sectionProfessors sp " +
            "WHERE s.course.courseNum = :courseNumber " +
            "AND s.academicPeriod.academicPeriodId = :academicPeriodId")
    List<Section> findByCourseNumber(
            @Param("courseNumber") String courseNumber,
            @Param("academicPeriodId") Integer academicPeriodId
    );

    @Query("SELECT DISTINCT s FROM Section s " +
            "LEFT JOIN FETCH s.sectionProfessors sp " +
            "WHERE s.course.courseNum IN :courseNumbers " +
            "AND s.academicPeriod.academicPeriodId = :academicPeriodId")
    List<Section> findByCourseNumberInAndAcademicPeriodId(
            @Param("courseNumbers") List<String> courseNumbers,
            @Param("academicPeriodId") Integer academicPeriodId
    );
}