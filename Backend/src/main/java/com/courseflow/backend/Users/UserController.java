package com.courseflow.backend.Users;

import com.courseflow.backend.DegreePrograms.DegreeProgram;
import com.courseflow.backend.DegreePrograms.DegreeProgramRepository;
import com.courseflow.backend.DegreePrograms.DegreeType;
import com.courseflow.backend.Settings.Settings;
import com.courseflow.backend.Settings.SettingsRepository;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlan;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlanRepository;
import com.courseflow.backend.Users.Profiles.UserProfile;
import com.courseflow.backend.Users.Profiles.UserProfileService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:8081" })
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserProfileService profileService;

    @Autowired
    private SettingsRepository settingsRepository;

    @Autowired
    private GoogleAuthService googleAuthService;

    @Autowired
    private UserDegreePlanRepository userDegreePlanRepo;

    @Autowired
    private DegreeProgramRepository degreeProgramRepo;

    // --- DTOs ---

    public static class GoogleLoginRequest {
        private String code;
        private String platform;
        private String deviceId;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getPlatform() {
            return platform;
        }

        public void setPlatform(String platform) {
            this.platform = platform;
        }

        public String getDeviceId() {
            return deviceId;
        }

        public void setDeviceId(String deviceId) {
            this.deviceId = deviceId;
        }
    }

    public static class OnboardingRequest {
        private List<String> majors;
        private List<String> minors;
        private String graduationYear;

        public List<String> getMajors() {
            return majors;
        }

        public void setMajors(List<String> majors) {
            this.majors = majors;
        }

        public List<String> getMinors() {
            return minors;
        }

        public void setMinors(List<String> minors) {
            this.minors = minors;
        }

        public String getGraduationYear() {
            return graduationYear;
        }

        public void setGraduationYear(String graduationYear) {
            this.graduationYear = graduationYear;
        }
    }

    public static class LogoutRequest {
        private String netId;
        private String deviceId;

        public String getNetId() {
            return netId;
        }

        public void setNetId(String netId) {
            this.netId = netId;
        }

        public String getDeviceId() {
            return deviceId;
        }

        public void setDeviceId(String deviceId) {
            this.deviceId = deviceId;
        }
    }

    public static class RefreshRequest {
        private String refreshToken;

        public String getRefreshToken() {
            return refreshToken;
        }

        public void setRefreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
        }
    }

    // --- ENDPOINTS ---

    @PostMapping("/google")
    public ResponseEntity<ApiResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            // 1. Verify code
            GoogleIdToken.Payload payload = googleAuthService.verifyGoogleCode(request.getCode());

            String email = payload.getEmail();
            String googleId = payload.getSubject();

            // --- Extract Names ---
            String fullName = (String) payload.get("name");
            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");

            // 2. CHECK: Only allow @iastate.edu emails
            if (!email.endsWith("@iastate.edu")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Access restricted to @iastate.edu emails only."));
            }

            // 3. Find or Create User
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                String generatedNetId = email.split("@")[0];

                // Pass all 3 name fields to the constructor
                User newUser = new User(googleId, email, generatedNetId, fullName, firstName, lastName);

                User savedUser = userRepository.save(newUser);
                profileService.createProfile(savedUser);

                if (!settingsRepository.existsById(savedUser.getNetid())) {
                    Settings defaultSettings = new Settings(savedUser.getNetid());
                    settingsRepository.save(defaultSettings);
                }
                return savedUser;
            });

            // 4. Generate Access Token
            String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getAccountLevel().name());

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("accessToken", accessToken);
            responseData.put("netId", user.getNetid());
            responseData.put("email", user.getEmail());
            responseData.put("name", user.getFullName());
            responseData.put("firstName", user.getFirstName()); // Optional: send back to frontend
            responseData.put("onboarded", user.isOnboarded());
            responseData.put("role", user.getAccountLevel());

            // 5. Handle Mobile Refresh Tokens
            if ("mobile".equalsIgnoreCase(request.getPlatform()) && request.getDeviceId() != null) {
                String refreshToken = jwtService.generateRefreshToken();
                LocalDateTime refreshExpiry = LocalDateTime.now().plusDays(30);

                user.getRefreshTokens().put(request.getDeviceId(), refreshToken);
                user.getRefreshTokenExpiries().put(request.getDeviceId(), refreshExpiry);
                userRepository.save(user);

                responseData.put("refreshToken", refreshToken);
                responseData.put("deviceId", request.getDeviceId());
            }

            return ResponseEntity.ok(new ApiResponse(true, "Login successful", responseData, accessToken));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Authentication failed: " + e.getMessage()));
        }
    }

    @PostMapping("/onboard")
    public ResponseEntity<ApiResponse> completeOnboarding(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody OnboardingRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtService.extractUserId(token);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            UserProfile profile = user.getProfile();

            // Create user_degree_plans entries (authoritative source for majors/minors)
            if (request.getMajors() != null) {
                for (String programId : request.getMajors()) {
                    if (programId != null && !programId.isBlank()) {
                        degreeProgramRepo.findById(programId).ifPresent(p ->
                            userDegreePlanRepo.save(new UserDegreePlan(user, p, DegreeType.MAJOR))
                        );
                    }
                }
            }
            if (request.getMinors() != null) {
                for (String programId : request.getMinors()) {
                    if (programId != null && !programId.isBlank()) {
                        degreeProgramRepo.findById(programId).ifPresent(p ->
                            userDegreePlanRepo.save(new UserDegreePlan(user, p, DegreeType.MINOR))
                        );
                    }
                }
            }

            // Sync profile table from the now-authoritative user_degree_plans
            List<com.courseflow.backend.Users.DegreePlan.UserDegreePlan> plans =
                userDegreePlanRepo.findByUserId(user.getId());
            profile.setMajors(plans.stream()
                .filter(p -> p.getDegreeType() == DegreeType.MAJOR)
                .map(p -> p.getDegreeProgram().getProgramId())
                .collect(java.util.stream.Collectors.toList()));
            profile.setMinors(plans.stream()
                .filter(p -> p.getDegreeType() == DegreeType.MINOR)
                .map(p -> p.getDegreeProgram().getProgramId())
                .collect(java.util.stream.Collectors.toList()));
            profile.setGraduationYear(request.getGraduationYear());

            profileService.updateProfile(profile);

            // Update User status
            user.setOnboarded(true);
            userRepository.save(user);

            return ResponseEntity.ok(new ApiResponse(true, "Onboarding complete"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error during onboarding"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(@RequestBody LogoutRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByNetid(request.getNetId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (request.getDeviceId() != null) {
                    user.getRefreshTokens().remove(request.getDeviceId());
                    user.getRefreshTokenExpiries().remove(request.getDeviceId());
                }
                userRepository.save(user);
            }
            return ResponseEntity.ok(new ApiResponse(true, "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error during logout"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse> refreshToken(@RequestBody RefreshRequest refreshRequest) {
        try {
            Optional<User> userOpt = userRepository.findByRefreshToken(refreshRequest.getRefreshToken());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse(false, "Invalid refresh token"));
            }
            User user = userOpt.get();
            String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getAccountLevel().name());
            return ResponseEntity.ok(new ApiResponse(true, "Token refreshed", newAccessToken));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error refreshing token"));
        }
    }

    @GetMapping("/majors")
    public ResponseEntity<ApiResponse> getUserMajors(@RequestHeader("Authorization") String authHeader) {
        try {
            // 1. Authenticate the user
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtService.extractUserId(token);

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse(false, "User not found"));
            }

            User user = userOpt.get();

            // 2. Return fresh data using your new helper method
            return ResponseEntity.ok(new ApiResponse(true, "Majors fetched", user.getMajors()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching majors"));
        }
    }

    @GetMapping("/minors")
    public ResponseEntity<ApiResponse> getUserMinors(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtService.extractUserId(token);

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse(false, "User not found"));
            }

            User user = userOpt.get();

            // 2. Return fresh data using your new helper method
            return ResponseEntity.ok(new ApiResponse(true, "Minors fetched", user.getMinors()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching minors"));
        }
    }

    //TESTING PURPOSES ONLY:
    @GetMapping("/dev/token")
    public String getTestToken(@RequestParam String email){
        User user = userRepository.findByEmail(email).orElseThrow(()-> new RuntimeException("user not found"));

        return jwtService.generateAccessToken(user.getId(),
                user.getEmail(),
                user.getAccountLevel().name());

    }

}
