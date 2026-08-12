package com.courseflow.backend.Schedules;

import com.courseflow.backend.SmartScheduler.Entity.AcademicPeriod;
import com.courseflow.backend.SmartScheduler.Entity.Section;
import com.courseflow.backend.SmartScheduler.SectionRepository;
import com.courseflow.backend.SmartScheduler.AcademicPeriodRepository;
import com.courseflow.backend.Users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScheduleValidationService {

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private AcademicPeriodRepository academicPeriodRepository;

    @Autowired
    private UserRepository userRepository;

    private static final Set<String> VALID_DAYS = Set.of("Mon", "Tue", "Wed", "Thu", "Fri");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    private static class SectionWithIdentifier {
        Section section;
        String identifier;
        SectionWithIdentifier(Section section, String identifier) {
            this.section = section;
            this.identifier = identifier;
        }
    }

    public ValidationResult validateSchedule(String netId, SaveScheduleRequest request) {
        List<String> errors = new ArrayList<>();

        // 0. Validate that netId exists in the database (ADD THIS)
        if (netId == null || netId.trim().isEmpty()) {
            errors.add("netId is required");
            return new ValidationResult(false, errors);
        }

        boolean userExists = userRepository.existsByNetid(netId);
        if (!userExists) {
            errors.add("User with netId '" + netId + "' does not exist");
            return new ValidationResult(false, errors);
        }

        // 1. Resolve academic period name to ID
        Integer academicPeriodId = resolveAcademicPeriod(request.getAcademicPeriodName(), errors);
        if (academicPeriodId == null) {
            return new ValidationResult(false, errors);
        }

        // 2. Fetch sections, keeping the original identifiers
        List<SectionWithIdentifier> sectionsWithId = fetchSections(request.getSelectedSections(), academicPeriodId, errors);

        // 3. Parse blocked times
        List<ParsedBlockedTime> parsedBlockedTimes = parseBlockedTimes(request.getBlockedTimes(), errors);

        // 4. Check overlaps using the original identifiers in error messages
        if (!sectionsWithId.isEmpty()) {
            validateNoSectionOverlaps(sectionsWithId, errors);
        }

        // 5. Check conflicts with blocked times
        if (!sectionsWithId.isEmpty() && !parsedBlockedTimes.isEmpty()) {
            validateNoConflictsWithBlocked(sectionsWithId, parsedBlockedTimes, errors);
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }
    private Integer resolveAcademicPeriod(String periodName, List<String> errors) {
        if (periodName == null || periodName.trim().isEmpty()) {
            errors.add("academicPeriodName is required");
            return null;
        }
        Optional<AcademicPeriod> opt = academicPeriodRepository.findByName(periodName.trim());
        if (opt.isPresent()) {
            return opt.get().getAcademicPeriodId();
        } else {
            errors.add("Academic period not found: " + periodName);
            return null;
        }
    }

    private List<SectionWithIdentifier> fetchSections(List<String> sectionIdentifiers, Integer academicPeriodId, List<String> errors) {
        if (sectionIdentifiers == null || sectionIdentifiers.isEmpty()) {
            return Collections.emptyList();
        }

        List<SectionWithIdentifier> result = new ArrayList<>();
        for (String identifier : sectionIdentifiers) {
            int lastHyphen = identifier.lastIndexOf('-');
            if (lastHyphen == -1 || lastHyphen == 0 || lastHyphen == identifier.length() - 1) {
                errors.add("Invalid section identifier format (expected 'courseNumber-sectionNumber'): " + identifier);
                continue;
            }

            String courseNumber = identifier.substring(0, lastHyphen).trim();
            String sectionNumber = identifier.substring(lastHyphen + 1).trim();

            Optional<Section> opt = sectionRepository.findByCourseNumberAndSectionNumberAndAcademicPeriod(
                    courseNumber, sectionNumber, academicPeriodId);
            if (opt.isPresent()) {
                result.add(new SectionWithIdentifier(opt.get(), identifier));
            } else {
                errors.add("Section not found: " + identifier + " for academic period ID " + academicPeriodId);
            }
        }
        return result;
    }

    private List<ParsedBlockedTime> parseBlockedTimes(List<SaveScheduleRequest.BlockedTime> blockedTimes, List<String> errors) {
        if (blockedTimes == null || blockedTimes.isEmpty()) return Collections.emptyList();

        List<ParsedBlockedTime> parsed = new ArrayList<>();
        for (SaveScheduleRequest.BlockedTime bt : blockedTimes) {
            if (!VALID_DAYS.contains(bt.getDay())) {
                errors.add("Invalid day: " + bt.getDay() + ". Must be one of Mon, Tue, Wed, Thu, Fri");
                continue;
            }
            try {
                LocalTime start = LocalTime.parse(bt.getStart(), DateTimeFormatter.ofPattern("HH:mm"));
                LocalTime end = LocalTime.parse(bt.getEnd(), DateTimeFormatter.ofPattern("HH:mm"));
                if (end.isBefore(start) || end.equals(start)) {
                    errors.add("Blocked time end must be after start for " + bt.getDay());
                } else {
                    parsed.add(new ParsedBlockedTime(bt.getDay(), start, end));
                }
            } catch (DateTimeParseException e) {
                errors.add("Invalid time format for blocked time on " + bt.getDay() + ". Use HH:mm (e.g., 10:00)");
            }
        }
        return parsed;
    }


    private void validateNoSectionOverlaps(List<SectionWithIdentifier> sectionsWithId, List<String> errors) {
        List<SectionMeeting> allMeetings = new ArrayList<>();
        for (SectionWithIdentifier sw : sectionsWithId) {
            Section sec = sw.section;
            List<MeetingTime> meetings = parseMeetingPatterns(sec.getMeetingPatterns(), sec.getSectionId());
            for (MeetingTime m : meetings) {
                allMeetings.add(new SectionMeeting(sw.identifier, m.day, m.start, m.end));
            }
        }

        Map<String, List<SectionMeeting>> byDay = allMeetings.stream()
                .collect(Collectors.groupingBy(m -> m.day));

        for (Map.Entry<String, List<SectionMeeting>> entry : byDay.entrySet()) {
            List<SectionMeeting> dayMeetings = entry.getValue();
            dayMeetings.sort(Comparator.comparing(m -> m.start));
            for (int i = 0; i < dayMeetings.size() - 1; i++) {
                SectionMeeting current = dayMeetings.get(i);
                SectionMeeting next = dayMeetings.get(i + 1);
                if (current.end.isAfter(next.start)) {
                    errors.add(String.format("Sections %s and %s overlap on %s",
                            current.identifier, next.identifier, entry.getKey()));
                }
            }
        }
    }

    private void validateNoConflictsWithBlocked(List<SectionWithIdentifier> sectionsWithId, List<ParsedBlockedTime> blockedTimes, List<String> errors) {
        List<SectionMeeting> allMeetings = new ArrayList<>();
        for (SectionWithIdentifier sw : sectionsWithId) {
            Section sec = sw.section;
            List<MeetingTime> meetings = parseMeetingPatterns(sec.getMeetingPatterns(), sec.getSectionId());
            for (MeetingTime m : meetings) {
                allMeetings.add(new SectionMeeting(sw.identifier, m.day, m.start, m.end));
            }
        }

        for (SectionMeeting meeting : allMeetings) {
            for (ParsedBlockedTime blocked : blockedTimes) {
                if (meeting.day.equals(blocked.day)) {
                    if (meeting.start.isBefore(blocked.end) && meeting.end.isAfter(blocked.start)) {
                        errors.add(String.format("Section %s conflicts with blocked time on %s %s-%s",
                                meeting.identifier, blocked.day, blocked.start, blocked.end));
                    }
                }
            }
        }
    }

    private static class SectionMeeting {
        String identifier;   // user‑provided identifier,ex: "COMS 2280-01"
        String day;
        LocalTime start;
        LocalTime end;
        SectionMeeting(String identifier, String day, LocalTime start, LocalTime end) {
            this.identifier = identifier;
            this.day = day;
            this.start = start;
            this.end = end;
        }
    }


    private List<MeetingTime> parseMeetingPatterns(String pattern, Integer sectionId) {
        List<MeetingTime> result = new ArrayList<>();
        if (pattern == null || pattern.trim().isEmpty()) return result;

        String[] patterns = pattern.split(";");
        for (String p : patterns) {
            p = p.trim();
            if (p.isEmpty()) continue;
            String[] parts = p.split("\\|");
            if (parts.length != 2) continue;
            String daysPart = parts[0].trim();
            String timePart = parts[1].trim();
            String[] timeRange = timePart.split("-");
            if (timeRange.length != 2) continue;
            try {
                LocalTime start = LocalTime.parse(timeRange[0].trim(), TIME_FORMATTER);
                LocalTime end = LocalTime.parse(timeRange[1].trim(), TIME_FORMATTER);
                for (char c : daysPart.toCharArray()) {
                    String day = convertDayCharToName(c);
                    if (day != null) {
                        result.add(new MeetingTime(day, start, end));
                    }
                }
            } catch (Exception e) {
                // skip
            }
        }
        return result;
    }

    private String convertDayCharToName(char c) {
        switch (c) {
            case 'M': return "Mon";
            case 'T': return "Tue";
            case 'W': return "Wed";
            case 'R': return "Thu";
            case 'F': return "Fri";
            default: return null;
        }
    }

    private static class MeetingTime {
        String day; LocalTime start; LocalTime end;
        MeetingTime(String day, LocalTime start, LocalTime end) { this.day = day; this.start = start; this.end = end; }
    }

    private static class ParsedBlockedTime {
        String day; LocalTime start; LocalTime end;
        ParsedBlockedTime(String day, LocalTime start, LocalTime end) { this.day = day; this.start = start; this.end = end; }
    }

    public static class ValidationResult {
        private final boolean valid; private final List<String> errors;
        public ValidationResult(boolean valid, List<String> errors) { this.valid = valid; this.errors = errors; }
        public boolean isValid() { return valid; }
        public List<String> getErrors() { return errors; }
    }
}