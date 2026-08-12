package com.courseflow.backend.Chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LLMService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${openai.api.key:}")
    private String apiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    @PostConstruct
    public void init() {
        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("⚠️ OpenAI API key is NULL or EMPTY");
        } else {
            apiKey = apiKey.trim();
            System.out.println("✅ API Key loaded - length: " + apiKey.length());
        }
    }

    public String extractPreferences(String userMessage, String currentConstraints) {

        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("OpenAI API key not configured, using fallback");
            return "{}";
        }

        String systemPrompt = """
            You are a university course scheduling assistant for Iowa State University.

            Your ONLY job is to extract scheduling preferences from student messages.

            CREDIT RULES (Undergraduate):
            - Fall/Spring Full-time: 12-15 credits
            - Fall/Spring Part-time: 6-11 credits
            - Summer Full-time: 9 credits
            - Summer Part-time: 4-8 credits

            TIME RULES:
            1. Days: Mon, Tue, Wed, Thu, Fri only
            2. Times: HH:mm 24-hour format
            3. "morning" = block 08:00-11:00 on ALL weekdays
            4. "evening" = block 17:00-22:00 on ALL weekdays
            5. "after 7pm" = block 19:00-22:00 on ALL weekdays
            6. "No Fridays" = block Friday 08:00-22:00

            OUTPUT FORMAT:
            Return ONLY valid JSON. No explanations, no markdown, no extra text.

            Example outputs:
            - {"blockedTimes":[{"day":"Mon","start":"08:00","end":"11:00"}],"registrationStatus":null,"isComplete":false}
            - {"blockedTimes":[{"day":"Fri","start":"08:00","end":"22:00"}],"registrationStatus":"Full-time","isComplete":false}
            - {"blockedTimes":[],"registrationStatus":null,"isComplete":true}
            """;

        String userPrompt = String.format("""
            Current constraints already set:
            %s

            Student's new message: "%s"

            Extract ONLY the NEW preferences from this message.
            Return JSON with any updates.
            """, currentConstraints, userMessage);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
            ));
            requestBody.put("temperature", 0.3);
            requestBody.put("response_format", Map.of("type", "json_object"));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(OPENAI_URL, request, Map.class);

            List<Map> choices = (List<Map>) response.getBody().get("choices");
            Map message = (Map) choices.get(0).get("message");
            String content = (String) message.get("content");

            System.out.println("LLM Response: " + content);
            return content;

        } catch (Exception e) {
            System.err.println("Error calling OpenAI: " + e.getMessage());
            e.printStackTrace();
            return "{}";
        }
    }
}