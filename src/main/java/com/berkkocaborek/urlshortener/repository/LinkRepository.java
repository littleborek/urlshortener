package com.berkkocaborek.urlshortener.repository;

import com.berkkocaborek.urlshortener.model.Link;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LinkRepository extends JpaRepository<Link, Long> {

    
    Optional<Link> findByShortKey(String shortKey);
}