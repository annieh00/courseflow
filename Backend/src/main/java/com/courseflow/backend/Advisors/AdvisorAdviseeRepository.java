//AdvisorAdviseeRepository.java - Repository interface for managing AdvisorAdvisee entities
package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface AdvisorAdviseeRepository extends JpaRepository<AdvisorAdvisee, Long> {

    List<AdvisorAdvisee> findByAdvisor(User advisor);

    List<AdvisorAdvisee> findByStudent(User student);

    Optional<AdvisorAdvisee> findByAdvisorAndStudent(User advisor, User student);

    @Transactional
    void deleteByStudent(User student);

    @Transactional
    void deleteByAdvisorAndStudent(User advisor, User student);

    boolean existsByAdvisorAndStudent(User advisor, User student);
}