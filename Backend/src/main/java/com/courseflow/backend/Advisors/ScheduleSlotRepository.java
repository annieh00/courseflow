package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, Long> {

    List<ScheduleSlot> findByAdvisor_NetidAndStatusAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            String advisorNetid,
            ScheduleStatus status,
            LocalDate slotDate
    );

    List<ScheduleSlot> findByAdvisor(User advisor);

    List<ScheduleSlot> findByAdvisor_NetidAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            String advisorNetid,
            LocalDate slotDate
    );

    Optional<ScheduleSlot> findByAdvisorAndSlotDateAndStartTime(User advisor, LocalDate slotDate, LocalTime startTime);

    List<ScheduleSlot> findByStudentOrderBySlotDateAscStartTimeAsc(User student);

    List<ScheduleSlot> findByAdvisorAndStatusAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            User advisor,
            ScheduleStatus status,
            LocalDate slotDate
    );

    List<ScheduleSlot> findByStatusAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            ScheduleStatus status,
            LocalDate slotDate
    );

    List<ScheduleSlot> findByAdvisorAndFromWeeklySlotIdAndStatusAndSlotDateGreaterThanEqual(
            User advisor, Long fromWeeklySlotId, ScheduleStatus status, LocalDate slotDate);
}