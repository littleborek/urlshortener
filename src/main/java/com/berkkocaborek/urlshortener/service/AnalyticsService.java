package com.berkkocaborek.urlshortener.service;

import com.berkkocaborek.urlshortener.model.ClickEvent;
import com.berkkocaborek.urlshortener.repository.ClickEventRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private final ClickEventRepository clickEventRepository;

    public AnalyticsService(ClickEventRepository clickEventRepository) {
        this.clickEventRepository = clickEventRepository;
    }

    /**
     * Records the click event asynchronously to the temporary PostgreSQL queue table.
     * This method must be called from a different method within LinkController or another Service.
     */
    @Async // Spring'in asenkron çalışmasını sağlar
    public void recordClickEvent(String shortKey, String ipAddress, String userAgent, String referrer) {
        ClickEvent event = new ClickEvent();
        event.setShortKey(shortKey);
        event.setIpAddress(ipAddress);
        event.setUserAgent(userAgent);
        event.setReferrer(referrer);
        
        try {
             clickEventRepository.save(event);
             // System.out.println("Click event recorded to DB queue: " + shortKey);
        } catch (Exception e) {
             System.err.println("Database queue save error: " + e.getMessage());
        }
    }
}