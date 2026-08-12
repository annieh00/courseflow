// Profiles/UserProfileController.java
package com.courseflow.backend.Users.Profiles;

import com.courseflow.backend.DegreePrograms.DegreeProgram;
import com.courseflow.backend.DegreePrograms.DegreeProgramRepository;
import com.courseflow.backend.DegreePrograms.DegreeType;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlan;
import com.courseflow.backend.Users.DegreePlan.UserDegreePlanRepository;
import com.courseflow.backend.Users.JwtService;
import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = {
        "http://localhost:8081",
})
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserRepository userRepository;
    private final UserProfileService profileService;
    private final JwtService jwtService;
    private final DegreeProgramRepository degreeProgramRepo;
    private final UserDegreePlanRepository userDegreePlanRepo;

    public UserProfileController(UserRepository userRepository,
                                 UserProfileService profileService,
                                 JwtService jwtService,
                                 DegreeProgramRepository degreeProgramRepo,
                                 UserDegreePlanRepository userDegreePlanRepo) {
        this.userRepository = userRepository;
        this.profileService = profileService;
        this.jwtService = jwtService;
        this.degreeProgramRepo = degreeProgramRepo;
        this.userDegreePlanRepo = userDegreePlanRepo;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtService.extractUserId(token);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
            }

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }

            Optional<UserProfile> profileOpt = profileService.getProfile(userOpt.get());
            if (profileOpt.isPresent()) {
                UserProfileResponseDTO response = new UserProfileResponseDTO(profileOpt.get());
                // Use user_degree_plans as the authoritative source for majors/minors
                List<UserDegreePlan> plans = userDegreePlanRepo.findByUserId(userId);
                response.setMajors(plans.stream()
                    .filter(p -> p.getDegreeType() == DegreeType.MAJOR)
                    .map(p -> p.getDegreeProgram().getProgramId())
                    .collect(Collectors.toList()));
                response.setMinors(plans.stream()
                    .filter(p -> p.getDegreeType() == DegreeType.MINOR)
                    .map(p -> p.getDegreeProgram().getProgramId())
                    .collect(Collectors.toList()));
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body("Profile not found");
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid token");
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestHeader("Authorization") String authHeader,
                                             @RequestBody UserProfileDTO data) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtService.extractUserId(token);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
            }

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }

            User user = userOpt.get();
            UserProfile profile = profileService.getProfile(user)
                    .orElseGet(() -> profileService.createProfile(user));

            // only update fields if they are not null in the DTO
            if (data.bio != null) profile.setBio(data.bio);
            if (data.photoUrl != null) profile.setPhotoUrl(data.photoUrl);
            if (data.displayName != null) profile.setDisplayName(data.displayName);
            if (data.graduationYear != null) profile.setGraduationYear(data.graduationYear);

            // Sync user_degree_plans first, then derive profile majors/minors from the result
            if (data.majors != null || data.minors != null) {
                List<UserDegreePlan> existingPlans = userDegreePlanRepo.findByUserId(userId);
                List<String> currentMajorIds = existingPlans.stream()
                    .filter(p -> p.getDegreeType() == DegreeType.MAJOR)
                    .map(p -> p.getDegreeProgram().getProgramId())
                    .collect(Collectors.toList());
                List<String> currentMinorIds = existingPlans.stream()
                    .filter(p -> p.getDegreeType() == DegreeType.MINOR)
                    .map(p -> p.getDegreeProgram().getProgramId())
                    .collect(Collectors.toList());
                syncDegreePlans(user,
                        data.majors != null ? data.majors : currentMajorIds,
                        data.minors != null ? data.minors : currentMinorIds);
                // Sync profile table back from the now-authoritative user_degree_plans
                List<UserDegreePlan> updatedPlans = userDegreePlanRepo.findByUserId(userId);
                profile.setMajors(updatedPlans.stream()
                    .filter(p -> p.getDegreeType() == DegreeType.MAJOR)
                    .map(p -> p.getDegreeProgram().getProgramId())
                    .collect(Collectors.toList()));
                profile.setMinors(updatedPlans.stream()
                    .filter(p -> p.getDegreeType() == DegreeType.MINOR)
                    .map(p -> p.getDegreeProgram().getProgramId())
                    .collect(Collectors.toList()));
            }

            profileService.updateProfile(profile);

            UserProfileResponseDTO response = new UserProfileResponseDTO(profile);
            // Return majors/minors from user_degree_plans for consistency
            List<UserDegreePlan> finalPlans = userDegreePlanRepo.findByUserId(userId);
            response.setMajors(finalPlans.stream()
                .filter(p -> p.getDegreeType() == DegreeType.MAJOR)
                .map(p -> p.getDegreeProgram().getProgramId())
                .collect(Collectors.toList()));
            response.setMinors(finalPlans.stream()
                .filter(p -> p.getDegreeType() == DegreeType.MINOR)
                .map(p -> p.getDegreeProgram().getProgramId())
                .collect(Collectors.toList()));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating profile: " + e.getMessage());
        }
    }

    private void syncDegreePlans(User user, List<String> majorIds, List<String> minorIds) {
        List<UserDegreePlan> existing = userDegreePlanRepo.findByUserId(user.getId());

        // Build the set of programIds that should exist after the update
        Set<String> desiredMajors = majorIds == null ? Set.of() :
                majorIds.stream().filter(s -> s != null && !s.isBlank()).collect(Collectors.toSet());
        Set<String> desiredMinors = minorIds == null ? Set.of() :
                minorIds.stream().filter(s -> s != null && !s.isBlank()).collect(Collectors.toSet());

        // Remove plans whose programId is no longer in either list
        for (UserDegreePlan plan : existing) {
            String pid = plan.getDegreeProgram().getProgramId();
            if (!desiredMajors.contains(pid) && !desiredMinors.contains(pid)) {
                userDegreePlanRepo.delete(plan);
            }
        }

        Set<String> existingProgramIds = existing.stream()
                .map(p -> p.getDegreeProgram().getProgramId())
                .collect(Collectors.toSet());

        // Add new major plans
        for (String programId : desiredMajors) {
            if (!existingProgramIds.contains(programId)) {
                Optional<DegreeProgram> prog = degreeProgramRepo.findById(programId);
                prog.ifPresent(p -> userDegreePlanRepo.save(new UserDegreePlan(user, p, DegreeType.MAJOR)));
            }
        }

        // Add new minor plans
        for (String programId : desiredMinors) {
            if (!existingProgramIds.contains(programId)) {
                Optional<DegreeProgram> prog = degreeProgramRepo.findById(programId);
                prog.ifPresent(p -> userDegreePlanRepo.save(new UserDegreePlan(user, p, DegreeType.MINOR)));
            }
        }
    }

    @GetMapping("/{netid}")
public ResponseEntity<?> getProfileByNetid(@PathVariable String netid) {
    try {
        Optional<User> userOpt = userRepository.findByNetid(netid);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Optional<UserProfile> profileOpt = profileService.getProfile(userOpt.get());

        if (profileOpt.isPresent()) {
            UserProfileResponseDTO response = new UserProfileResponseDTO(profileOpt.get());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body("Profile not found");
        }
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error fetching profile: " + e.getMessage());
    }
}

    
}