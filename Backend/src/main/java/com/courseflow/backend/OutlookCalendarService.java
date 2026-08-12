package com.courseflow.backend;

@Service
public class OutlookCalendarService {

    private final WebClient webClient;

    public OutlookCalendarService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://graph.microsoft.com/v1.0")
                .build();
    }

    public String createEvent(String accessToken, String studentName,
                              LocalDate slotDate, LocalTime startTime, LocalTime endTime) {

        String startDateTime = LocalDateTime.of(slotDate, startTime).toString();
        String endDateTime = LocalDateTime.of(slotDate, endTime).toString();

        Map<String, Object> payload = new HashMap<>();
        payload.put("subject", "Academic advising appointment with " + studentName);

        Map<String, String> start = new HashMap<>();
        start.put("dateTime", startDateTime);
        start.put("timeZone", "America/Chicago");

        Map<String, String> end = new HashMap<>();
        end.put("dateTime", endDateTime);
        end.put("timeZone", "America/Chicago");

        payload.put("start", start);
        payload.put("end", end);

        Map response = webClient.post()
                .uri("/me/events")
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return (String) response.get("id");
    }
}