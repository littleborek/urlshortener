package com.berkkocaborek.urlshortener.repository;

import com.berkkocaborek.urlshortener.model.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {
}