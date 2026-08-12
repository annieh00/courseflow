package com.courseflow.backend.Chatbot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/message")
    public ResponseEntity<?> chat(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String academicPeriod,
            @RequestBody ChatRequest request
    ) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ChatResponse("Message cannot be empty", "ERROR", List.of()));
        }

        if (authHeader == null || authHeader.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ChatResponse("Authorization header is required", "ERROR", List.of()));
        }

        if (academicPeriod == null || academicPeriod.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ChatResponse("Academic period is required", "ERROR", List.of()));
        }

        try {
            ChatResponse response = chatbotService.processMessage(authHeader, academicPeriod, request.getMessage());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ChatResponse("Error processing message: " + e.getMessage(), "ERROR", List.of()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "Chatbot service is running"));
    }
}