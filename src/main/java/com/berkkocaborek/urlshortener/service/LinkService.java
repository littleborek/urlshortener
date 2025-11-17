package com.berkkocaborek.urlshortener.service;

import com.berkkocaborek.urlshortener.model.Link;
import com.berkkocaborek.urlshortener.repository.LinkRepository;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;

@Service
public class LinkService {

    private final LinkRepository linkRepository;
    private final KvCacheService kvCacheService; // Dependency for Cloudflare KV interaction
    private final SecureRandom secureRandom = new SecureRandom();
    private final int KEY_LENGTH = 6;

    // Constructor Injection (updated to include KvCacheService)
    public LinkService(LinkRepository linkRepository, KvCacheService kvCacheService) {
        this.linkRepository = linkRepository;
        this.kvCacheService = kvCacheService;
    }

    /**
     * Generates a random 6-character Base62 compatible key
     */
    private String generateUniqueKey() {
        byte[] bytes = new byte[KEY_LENGTH];
        secureRandom.nextBytes(bytes);
        // Uses Base64 URL Safe and NoPadding for URL safety
        String key = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        
        // Truncates the key to ensure the desired length (6 characters).
        return key.substring(0, KEY_LENGTH);
    }

    /**
     * Creates a new short link, saves it to the DB, and writes it to KV cache (Cache-Aside)
     */
    public Link shortenUrl(String longUrl) {
        String shortKey;
        Optional<Link> existingLink;
        int maxAttempts = 10;
        int attempt = 0;

        // Loop for collision checking
        do {
            shortKey = generateUniqueKey();
            existingLink = linkRepository.findByShortKey(shortKey);
            attempt++;
            if (attempt >= maxAttempts) {
                // Throw an exception if max collision attempts fail
                throw new RuntimeException("Max collision attempts failed for key generation.");
            }
        } while (existingLink.isPresent());

        Link newLink = new Link();
        newLink.setLongUrl(longUrl);
        newLink.setShortKey(shortKey);

        Link savedLink = linkRepository.save(newLink); // 1. Save to PostgreSQL (Persistence)

        // 2. Write to KV Cache (Cache-Aside)
        // NOTE: This call is currently synchronized for error debugging
        kvCacheService.putCache(savedLink.getShortKey(), savedLink.getLongUrl());

        return savedLink;
    }

    /**
     * Finds the long URL based on the short key (Cache-Aside pattern)
     */
    public Optional<Link> getLongUrl(String shortKey) {
        // 1. KV Cache Check
        String longUrlFromCache = kvCacheService.getCache(shortKey);

        if (longUrlFromCache != null) {
            // Cache Hit: Found in KV! Redirection will be very fast
            Link link = new Link();
            link.setShortKey(shortKey);
            link.setLongUrl(longUrlFromCache);
            return Optional.of(link);
        }

        // 2. Cache Miss: Fallback to Database
        Optional<Link> linkFromDb = linkRepository.findByShortKey(shortKey);

        // Cache Rehydration: If retrieved from DB, write back to KV
        linkFromDb.ifPresent(link -> {
            kvCacheService.putCache(link.getShortKey(), link.getLongUrl());
        });

        return linkFromDb;
    }
}