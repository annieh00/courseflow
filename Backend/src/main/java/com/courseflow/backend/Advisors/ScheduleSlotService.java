package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ScheduleSlotService {

    @Autowired
    private ScheduleSlotRepository scheduleSlotRepository;

    @Autowired
    private AdvisorWeeklySlotRepository weeklySlotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdvisorAdviseeRepository advisorAdviseeRepository;

    public ScheduleSlot bookSlot(Long slotId, Long studentId) {
        ScheduleSlot slot = scheduleSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (slot.getStatus() == ScheduleStatus.BOOKED) {
            throw new RuntimeException("Slot is already booked");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        slot.setStudent(student);
        slot.setStatus(ScheduleStatus.BOOKED);
        return scheduleSlotRepository.save(slot);
    }

    /**
     * Creates a slot. If studentNetid is provided the slot is created as BOOKED (direct meeting).
     * Otherwise it is created as OPEN (available for students to book).
     */
    public ScheduleSlot createSlot(Long advisorId, LocalDate slotDate,
                                   LocalTime startTime, LocalTime endTime,
                                   String studentNetid) {
        User advisor = userRepository.findById(advisorId)
                .orElseThrow(() -> new RuntimeException("Advisor not found"));

        User student = null;
        ScheduleStatus status = ScheduleStatus.OPEN;

        if (studentNetid != null && !studentNetid.isBlank()) {
            student = userRepository.findByNetid(studentNetid)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentNetid));
            status = ScheduleStatus.BOOKED;
        }

        ScheduleSlot slot = new ScheduleSlot(advisor, student, slotDate, startTime, endTime, status);
        return scheduleSlotRepository.save(slot);
    }

    public void deleteSlot(Long slotId, Long advisorId) {
        ScheduleSlot slot = scheduleSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (!slot.getAdvisor().getId().equals(advisorId)) {
            throw new RuntimeException("Not authorized to delete this slot");
        }

        scheduleSlotRepository.deleteById(slotId);
    }

    /** Returns all upcoming booked slots assigned to the student. */
    public List<ScheduleSlot> getStudentAppointments(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return scheduleSlotRepository.findByStudentOrderBySlotDateAscStartTimeAsc(student);
    }

    /** Returns all OPEN future slots belonging to the student's assigned advisor(s). */
    public List<ScheduleSlot> getOpenSlotsForStudentAdvisors(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<AdvisorAdvisee> assignments = advisorAdviseeRepository.findByStudent(student);
        LocalDate today = LocalDate.now();
        List<ScheduleSlot> result = new ArrayList<>();

        for (AdvisorAdvisee assignment : assignments) {
            result.addAll(
                scheduleSlotRepository
                    .findByAdvisorAndStatusAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
                        assignment.getAdvisor(), ScheduleStatus.OPEN, today)
            );
        }

        return result;
    }

    /**
     * Books a specific time window within an OPEN slot.
     * Deletes the original slot and creates up to three new slots:
     * an OPEN slot for time before the window, a BOOKED slot for the window,
     * and an OPEN slot for time after the window.
     */
    public ScheduleSlot bookWindow(Long slotId, Long studentId,
                                   LocalTime windowStart, LocalTime windowEnd) {
        ScheduleSlot slot = scheduleSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (slot.getStatus() == ScheduleStatus.BOOKED) {
            throw new RuntimeException("Slot is already booked");
        }
        if (windowStart.isBefore(slot.getStartTime()) || windowEnd.isAfter(slot.getEndTime())) {
            throw new RuntimeException("Window must be within the slot bounds");
        }
        if (!windowEnd.isAfter(windowStart)) {
            throw new RuntimeException("End time must be after start time");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        User advisor = slot.getAdvisor();
        LocalDate date = slot.getSlotDate();
        LocalTime origStart = slot.getStartTime();
        LocalTime origEnd = slot.getEndTime();

        scheduleSlotRepository.deleteById(slotId);

        if (windowStart.isAfter(origStart)) {
            scheduleSlotRepository.save(
                new ScheduleSlot(advisor, null, date, origStart, windowStart, ScheduleStatus.OPEN));
        }

        ScheduleSlot booked = scheduleSlotRepository.save(
            new ScheduleSlot(advisor, student, date, windowStart, windowEnd, ScheduleStatus.BOOKED));

        if (windowEnd.isBefore(origEnd)) {
            scheduleSlotRepository.save(
                new ScheduleSlot(advisor, null, date, windowEnd, origEnd, ScheduleStatus.OPEN));
        }

        return booked;
    }

    /** Returns OPEN future slots from all advisors except the student's own assigned advisor(s). */
    public List<ScheduleSlot> getOtherAdvisorsOpenSlots(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Set<Long> myAdvisorIds = advisorAdviseeRepository.findByStudent(student)
                .stream()
                .map(a -> a.getAdvisor().getId())
                .collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        return scheduleSlotRepository
                .findByStatusAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(ScheduleStatus.OPEN, today)
                .stream()
                .filter(s -> !myAdvisorIds.contains(s.getAdvisor().getId()))
                .collect(Collectors.toList());
    }

    /** Student cancels their own appointment; slot reverts to OPEN. */
    public ScheduleSlot cancelAppointment(Long slotId, Long studentId) {
        ScheduleSlot slot = scheduleSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (slot.getStudent() == null || !slot.getStudent().getId().equals(studentId)) {
            throw new RuntimeException("Not authorized to cancel this appointment");
        }

        slot.setStudent(null);
        slot.setStatus(ScheduleStatus.OPEN);
        return scheduleSlotRepository.save(slot);
    }

    /**
     * Generates ScheduleSlot records for every day in [fromDate, toDate] that
     * matches the advisor's weekly template. Tags each created slot with the
     * source weekly slot ID so future edits can propagate. Skips dates that
     * already have a slot at the same start time.
     */
    public int applyWeeklyTemplate(Long advisorId, LocalDate fromDate, LocalDate toDate) {
        User advisor = userRepository.findById(advisorId)
                .orElseThrow(() -> new RuntimeException("Advisor not found"));

        List<AdvisorWeeklySlot> template =
                weeklySlotRepository.findByAdvisor_IdOrderByDayOfWeekAscStartTimeAsc(advisorId);

        if (template.isEmpty()) return 0;

        int created = 0;
        LocalDate current = fromDate;

        while (!current.isAfter(toDate)) {
            int dow = current.getDayOfWeek().getValue();
            for (AdvisorWeeklySlot ws : template) {
                if (ws.getDayOfWeek() == dow) {
                    boolean exists = scheduleSlotRepository
                            .findByAdvisorAndSlotDateAndStartTime(advisor, current, ws.getStartTime())
                            .isPresent();
                    if (!exists) {
                        ScheduleSlot slot = new ScheduleSlot(
                                advisor, null, current, ws.getStartTime(), ws.getEndTime(), ScheduleStatus.OPEN);
                        slot.setFromWeeklySlotId(ws.getId());
                        scheduleSlotRepository.save(slot);
                        created++;
                    }
                }
            }
            current = current.plusDays(1);
        }

        return created;
    }

    /**
     * Atomically saves a new weekly slot and auto-generates the next 90 days.
     * The @Transactional ensures that if auto-apply fails, the weekly slot
     * insert is rolled back too — preventing partial DB state on error.
     */
    @Transactional
    public Map<String, Object> createWeeklySlotAndApply(Long advisorId, int dayOfWeek,
                                                         LocalTime start, LocalTime end) {
        User advisor = userRepository.findById(advisorId)
                .orElseThrow(() -> new RuntimeException("Advisor not found"));

        // Pre-check: reject duplicate before hitting the DB constraint
        boolean duplicate = weeklySlotRepository
                .findByAdvisor_IdOrderByDayOfWeekAscStartTimeAsc(advisorId)
                .stream()
                .anyMatch(ws -> ws.getDayOfWeek() == dayOfWeek && ws.getStartTime().equals(start));
        if (duplicate) {
            throw new RuntimeException("A weekly slot already exists for that day and start time");
        }

        AdvisorWeeklySlot ws = new AdvisorWeeklySlot(advisor, dayOfWeek, start, end);
        ws = weeklySlotRepository.save(ws);

        int created = doAutoApply(advisor, ws);

        Map<String, Object> result = new HashMap<>();
        result.put("id", ws.getId());
        result.put("dayOfWeek", ws.getDayOfWeek());
        result.put("startTime", ws.getStartTime().toString());
        result.put("endTime", ws.getEndTime().toString());
        result.put("slotsCreated", created);
        return result;
    }

    /** Public entry-point used by the controller when the User isn't already loaded. */
    public int autoApplyNewWeeklySlot(Long advisorId, AdvisorWeeklySlot ws) {
        User advisor = userRepository.findById(advisorId)
                .orElseThrow(() -> new RuntimeException("Advisor not found"));
        return doAutoApply(advisor, ws);
    }

    /** Core loop — called internally when we already have the User entity. */
    private int doAutoApply(User advisor, AdvisorWeeklySlot ws) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(90);
        int created = 0;
        LocalDate current = today;

        while (!current.isAfter(endDate)) {
            if (current.getDayOfWeek().getValue() == ws.getDayOfWeek()) {
                boolean exists = scheduleSlotRepository
                        .findByAdvisorAndSlotDateAndStartTime(advisor, current, ws.getStartTime())
                        .isPresent();
                if (!exists) {
                    ScheduleSlot slot = new ScheduleSlot(
                            advisor, null, current, ws.getStartTime(), ws.getEndTime(), ScheduleStatus.OPEN);
                    slot.setFromWeeklySlotId(ws.getId());
                    scheduleSlotRepository.save(slot);
                    created++;
                }
            }
            current = current.plusDays(1);
        }

        return created;
    }

    /**
     * Updates the time of all future OPEN slots that were generated by the
     * given weekly slot. Booked slots are never modified.
     */
    public int propagateWeeklySlotUpdate(Long advisorId, Long weeklySlotId,
                                         LocalTime newStart, LocalTime newEnd) {
        User advisor = userRepository.findById(advisorId)
                .orElseThrow(() -> new RuntimeException("Advisor not found"));

        LocalDate today = LocalDate.now();
        List<ScheduleSlot> futures = scheduleSlotRepository
                .findByAdvisorAndFromWeeklySlotIdAndStatusAndSlotDateGreaterThanEqual(
                        advisor, weeklySlotId, ScheduleStatus.OPEN, today);

        for (ScheduleSlot slot : futures) {
            slot.setStartTime(newStart);
            slot.setEndTime(newEnd);
            scheduleSlotRepository.save(slot);
        }

        return futures.size();
    }

    /**
     * Deletes all future OPEN slots that were generated by the given weekly slot.
     * Booked slots are never touched.
     */
    public int removeWeeklySlotFromCalendar(Long advisorId, Long weeklySlotId) {
        User advisor = userRepository.findById(advisorId)
                .orElseThrow(() -> new RuntimeException("Advisor not found"));

        LocalDate today = LocalDate.now();
        List<ScheduleSlot> futures = scheduleSlotRepository
                .findByAdvisorAndFromWeeklySlotIdAndStatusAndSlotDateGreaterThanEqual(
                        advisor, weeklySlotId, ScheduleStatus.OPEN, today);

        int removed = futures.size();
        scheduleSlotRepository.deleteAll(futures);
        return removed;
    }
}
