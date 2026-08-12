package com.courseflow.backend.Schedules;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SavedScheduleRepository extends JpaRepository<SavedSchedule, String> {
    List<SavedSchedule> findByNetId(String netId);
    Optional<SavedSchedule> findByScheduleIdAndNetId(String scheduleId, String netId);
    void deleteByScheduleIdAndNetId(String scheduleId, String netId);
}