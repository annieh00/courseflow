package com.courseflow.backend.Users;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.courseflow.backend.Users.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepo;

    public UserService(UserRepository userRepo){
       this.userRepo = userRepo;
    }

    //request
    @Transactional
    public User requestPromotion(Long userId, AccountLevel desiredRole){
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("user not found"));

        if(!desiredRole.isHigherThan(user.getAccountLevel())){
            throw new RuntimeException("you cannot request a role equal to or lower than your current level");
        }
        user.setRequestedRole(desiredRole);
        user.setStatus(UserApprovalStatus.PENDING);

        return userRepo.save(user);
    }


}
