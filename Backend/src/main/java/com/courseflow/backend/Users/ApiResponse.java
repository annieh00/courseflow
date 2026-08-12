package com.courseflow.backend.Users;

public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;
    private String token; // ADD THIS FIELD

    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public ApiResponse(boolean success, String message, Object data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    // ADD THIS NEW CONSTRUCTOR:
    public ApiResponse(boolean success, String message, Object data, String token) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.token = token;
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }

    // ADD GETTER AND SETTER FOR TOKEN:
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}