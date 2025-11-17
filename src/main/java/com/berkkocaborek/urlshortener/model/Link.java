package com.berkkocaborek.urlshortener.model;

import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor; 

@Data
@Entity
@NoArgsConstructor
@Table(name = "links")
@AllArgsConstructor
public class Link {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "short_key", unique = true, nullable = false)
    private String shortKey;

    @Column(name = "long_url", nullable = false, length = 2048)
    private String longUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
 // JPA calls this method just before the entity is persisted to the database.
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

}
