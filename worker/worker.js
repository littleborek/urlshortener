/**
 * Cloudflare Worker - URL Shortener API
 * Required Bindings: KV Namespace (LINKS)
 */

// Frontend URL for redirection
const FRONTEND_URL = "https://short.berkk.cloud"; 
const SHORT_KEY_LENGTH = 4;
const ONE_WEEK_TTL = 7 * 24 * 60 * 60; // 604800 seconds

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // Remove trailing slash for clean path matching
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

        // CORS and Security Headers
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Max-Age": "86400", 
            "Access-Control-Allow-Headers": "Content-Type", 
            "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
            "X-Content-Type-Options": "nosniff"
        };
        
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // --- Handle POST /api/shorten ---
        if (request.method === "POST" && cleanPath === "/api/shorten") {
            try {
                // Expect JSON payload: { longUrl: "...", customSlug: "..." }
                const payload = await request.json(); 
                const longUrl = payload.longUrl;
                const customSlug = payload.customSlug;

                // Basic validation
                if (!longUrl || longUrl.length < 5) {
                    return new Response("Invalid URL", { status: 400, headers: corsHeaders });
                }

                let shortKey;

                // 1. Handle Custom Slug
                if (customSlug) {
                    // Check if slug is already taken
                    const existingUrl = await env.LINKS.get(customSlug);
                    if (existingUrl) {
                        // 409 Conflict: Slug already exists
                        return new Response("Custom slug is already taken.", { status: 409, headers: corsHeaders });
                    }
                    shortKey = customSlug;
                } else {
                    // 2. Generate Random Key (Default)
                    shortKey = generateRandomString(SHORT_KEY_LENGTH);
                    // NOTE: A collision check loop is highly recommended here for production use.
                }
                
                // 3. Save to KV store with 7-day TTL
                await env.LINKS.put(shortKey, longUrl, { expirationTtl: ONE_WEEK_TTL });

                // Success response
                return new Response(JSON.stringify({ shortKey }), {
                    headers: { 
                        ...corsHeaders, 
                        "Content-Type": "application/json" 
                    },
                    status: 201
                });

            } catch (err) {
                // Catch JSON parse errors or other server issues
                return new Response("Invalid Request Payload or Server Error: " + err.message, { status: 500, headers: corsHeaders });
            }
        }
        
        // --- Handle GET /{key} redirection ---
        // Path length equals 5: /ABCD
        if (request.method === "GET" && cleanPath.length === SHORT_KEY_LENGTH + 1) {
            const key = cleanPath.slice(1); // Extract key (e.g., /ABCD -> ABCD)
            
            // Get URL from KV store
            const longUrl = await env.LINKS.get(key);
            
            if (longUrl) {
                // Redirect to long URL
                return Response.redirect(longUrl, 301);
            } else {
                // 404 Not Found
                return new Response("Link Not Found (404)", { status: 404, headers: corsHeaders });
            }
        }

        // Default 404 response
        return new Response("Unknown API Path", { headers: corsHeaders, status: 404 });
    },
};

// Helper Function: Random String Generator
function generateRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}