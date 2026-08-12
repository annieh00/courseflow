package com.courseflow.backend.Admin;

import com.courseflow.backend.Users.AccountLevel;
import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserApprovalStatus;
import com.courseflow.backend.Users.UserRepository;
import com.courseflow.backend.Courses.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AdminService {

    private final UserRepository userRepo;
    private final CourseRepository courseRepo;


    //constructor
    public AdminService(UserRepository userRepository, CourseRepository courseRepository){
        this.userRepo = userRepository;
        this.courseRepo = courseRepository;
    }

    public AdminStatsDTO getAdminDashStats(){
        long totalUsers = userRepo.count();
        long totalStudents = userRepo.countByRole(AccountLevel.STUDENT);
        long totalAdvisors = userRepo.countByRole(AccountLevel.ADVISOR);
        long totalAdmins = userRepo.countByRole(AccountLevel.ADMIN);;
        long totalCourses = courseRepo.count();

        long pendingAdmin = userRepo.countByRequestedRoleAndStatus(AccountLevel.ADMIN, UserApprovalStatus.PENDING);
        long pendingAdvisor = userRepo.countByRequestedRoleAndStatus(AccountLevel.ADVISOR, UserApprovalStatus.PENDING);

        return new AdminStatsDTO(
                totalUsers,
                totalStudents,
                totalAdvisors,
                totalAdmins,
                totalCourses,
                pendingAdmin,
                pendingAdvisor
        );
    }

    //handle requests to promote to admin or advisor
    @Transactional
    public User handleRequests(Long userId, boolean isApproved){
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("user not found"));

        if(isApproved){
            user.setAccountLevel(user.getRequestedRole());
        }
        user.setStatus(UserApprovalStatus.ACTIVE);
        user.setRequestedRole(null);
        return userRepo.save(user);
    }

}
