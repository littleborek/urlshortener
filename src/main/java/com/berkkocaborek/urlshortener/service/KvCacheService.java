package com.berkkocaborek.urlshortener.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class KvCacheService {

    private final WebClient webClient;
    private final String kvUrl;
    private final String apiToken;

    // Injects configuration values from application.properties
    public KvCacheService(@Value("${cloudflare.api-url}") String apiUrl,
                          @Value("${cloudflare.account-id}") String accountId,
                          @Value("${cloudflare.namespace-id}") String namespaceId,
                          @Value("${cloudflare.api-token}") String apiToken) {
        
        // Dynamically constructs the base KV API URL
        this.kvUrl = apiUrl
            .replace("{accountId}", accountId)
            .replace("{namespaceId}", namespaceId);
        
        this.apiToken = apiToken;

        // Configures WebClient with the Authorization Bearer Token
        this.webClient = WebClient.builder()
            .defaultHeader("Authorization", "Bearer " + apiToken)
            .build();
    }

    /**
     * Writes the shortKey and longUrl pair to the Cloudflare KV cache.
     * NOTE: This method is currently SYNCHRONOUS (.block()) for error debugging.
     */
    public void putCache(String shortKey, String longUrl) {
        try {
            webClient.put()
                .uri(kvUrl + shortKey)
                .bodyValue(longUrl)
                .retrieve()
                .toBodilessEntity()
                .block(); // <-- SYNCHRONOUS execution to force error reporting
            System.out.println("KV Cache write SUCCESS: " + shortKey);
        } catch (Exception error) {
            // Logs the error and re-throws it to halt the application, 
            // revealing the true cause (e.g., 401 Unauthorized)
            System.err.println("KV Cache WRITE ERROR: " + shortKey + " - " + error.getMessage());
            throw new RuntimeException("KV Write Error: " + error.getMessage(), error);
        }
    }

    /**
     * Retrieves the long URL from the KV cache using the short key.
     */
    public String getCache(String shortKey) {
        // Synchronous read is used here to immediately get the cache result.
        return webClient.get()
            .uri(kvUrl + shortKey)
            .retrieve()
            // Handles 4xx errors (like 404 Not Found) by returning null (Cache Miss)
            .onStatus(status -> status.is4xxClientError(), clientResponse -> {
                return reactor.core.publisher.Mono.empty();
            })
            .bodyToMono(String.class)
            .block();
    }
}