package com.courseflow.backend.Settings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;


/*
Controllers using GET and PATCH mappings
The GET mappings return an application/json with all the settings fields from the database.
The PATCH mapping requires application/json of whatever settings need patched,
not all settings need to updated to update one.
*/
@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    @Autowired
    private SettingsRepository settingsRepository;

    // GET settings via netId, user wants to see settings
    @GetMapping("/{netId}")
    public ResponseEntity<Settings> getSettings(@PathVariable String netId) {
        Optional<Settings> settingsOptional = settingsRepository.findById(netId);
        if (settingsOptional.isPresent()) {
            Settings settings = settingsOptional.get();
            return ResponseEntity.ok(settings);
        } else {
            // Not found 404
            return ResponseEntity.notFound().build();
        }
    }
    //PATCH: allows for users to change their settings
    @PatchMapping("/{netId}")
    public ResponseEntity<Settings> updateSettings(@PathVariable String netId, @RequestBody Map<String, Object> updates) {
        return settingsRepository.findById(netId)
                .map(settings -> {
                    updates.forEach((key, value) -> {
                        switch (key) {
                            case "darkMode": settings.setDarkMode((Boolean) value); break;
                            case "notificationsEnabled": settings.setNotificationsEnabled((Boolean) value); break;
                            case "courseReminders": settings.setCourseReminders((Boolean) value); break;
                            case "friendActivityNotifications": settings.setFriendActivityNotifications((Boolean) value); break;
                            case "profileVisible": settings.setProfileVisible((Boolean) value); break;
                        }
                    });
                    return ResponseEntity.ok(settingsRepository.save(settings));
                }).orElse(ResponseEntity.notFound().build());
    }

}
