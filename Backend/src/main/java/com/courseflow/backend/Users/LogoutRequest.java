package com.courseflow.backend.Users;

public class LogoutRequest {
    private String netId;
    private String deviceId; // Optional - for device-specific logout

    public String getNetId() {
        return netId != null ? netId.toLowerCase() : null;
    }
    public void setNetId(String netId) {
        this.netId = netId != null ? netId.toLowerCase() : null;
    }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}