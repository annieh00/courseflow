package com.courseflow.backend.Advisors;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdvisorWeeklySlotRepository extends JpaRepository<AdvisorWeeklySlot, Long> {

    List<AdvisorWeeklySlot> findByAdvisor_IdOrderByDayOfWeekAscStartTimeAsc(Long advisorId);

    List<AdvisorWeeklySlot> findByAdvisor_NetidOrderByDayOfWeekAscStartTimeAsc(String advisorNetid);
}
