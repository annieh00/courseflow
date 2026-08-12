package com.courseflow.backend.Chatbot;

import java.util.List;
import java.util.Map;

public class ChatResponse {
    private String message;
    private String action;
    private List<String> quickReplies;
    private Map<String, Object> payload;

    public ChatResponse(String message, String action, List<String> quickReplies) {
        this(message, action, quickReplies, null);
    }

    public ChatResponse(String message, String action, List<String> quickReplies, Map<String, Object> payload) {
        this.message = message;
        this.action = action;
        this.quickReplies = quickReplies;
        this.payload = payload;
    }

    public String getMessage() { return message; }
    public String getAction() { return action; }
    public List<String> getQuickReplies() { return quickReplies; }
    public Map<String, Object> getPayload() { return payload; }
}