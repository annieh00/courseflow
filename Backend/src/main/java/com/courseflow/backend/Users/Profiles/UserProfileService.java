package com.courseflow.backend.Users.Profiles;

import com.courseflow.backend.Users.User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserProfileService {

    private final UserProfileRepository profileRepository;

    public UserProfileService(UserProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public UserProfile createProfile(User user) {
        if (profileRepository.existsByUser(user)) {
            return profileRepository.findByUser(user).get();
        }
        UserProfile profile = new UserProfile(user);
        return profileRepository.save(profile);
    }

    public Optional<UserProfile> getProfile(User user) {
        return profileRepository.findByUser(user);
    }

    public UserProfile updateProfile(UserProfile profile) {
        return profileRepository.save(profile);
    }
}
