package com.berkkocaborek.urlshortener.controller;

import com.berkkocaborek.urlshortener.model.Link;
import com.berkkocaborek.urlshortener.service.AnalyticsService;
import com.berkkocaborek.urlshortener.service.LinkService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URI;

@RestController
public class LinkController {

    private final LinkService linkService;
    private final AnalyticsService analyticsService; 

    public LinkController(LinkService linkService, AnalyticsService analyticsService) {
        this.linkService = linkService;
        this.analyticsService = analyticsService;
    }

 // POST /api/shorten: Creates a new short link.
    @PostMapping("/api/shorten")
    public ResponseEntity<Link> shortenUrl(@RequestBody String longUrl) {
        if (longUrl == null || longUrl.trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Link link = linkService.shortenUrl(longUrl);
        return new ResponseEntity<>(link, HttpStatus.CREATED);
    }

    @GetMapping("/r/{key}")
    public ResponseEntity<Void> redirectToLongUrl(
            @PathVariable String key,
            @RequestHeader(value = "X-Forwarded-For", required = false) String ipAddress,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @RequestHeader(value = "Referer", required = false) String referrer) {

        Link link = linkService.getLongUrl(key)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short link not found."));

        

        analyticsService.recordClickEvent(key, ipAddress, userAgent, referrer);

       

        HttpHeaders headers = new HttpHeaders();
        String targetUrl = link.getLongUrl().startsWith("http") ? link.getLongUrl() : "https://" + link.getLongUrl();
        
        headers.setLocation(URI.create(targetUrl));
        return new ResponseEntity<>(headers, HttpStatus.MOVED_PERMANENTLY);
    }
}