package com.courseflow.backend.Degrees;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface DegreeRepository extends JpaRepository<Degree, Integer>{
    List<Degree> findAll();

    Optional<Degree> findBySubject(String subject);

    @Transactional
    void deleteBySubject(String name);

    //delete by unique id
    @Transactional
    void deleteById(int id);
}
