/**
 * Cloudflare Worker - URL Shortener API
 * Required Bindings: KV Namespace (LINKS)
 */

const FRONTEND_URL = "https://s.berkk.cloud"; // Sitenizin adresi
const SHORT_KEY_LENGTH = 4;
const ONE_WEEK_TTL = 604800; 

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // Remove trailing slash (e.g., /abcd/ -> /abcd)
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

        // CORS Headers
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Max-Age": "86400", 
            "Access-Control-Allow-Headers": "Content-Type", 
        };
        
        // Handle OPTIONS (Preflight)
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // 1. Handle Root Path (/) -> Redirect to Frontend Site
        if (cleanPath === "/" || cleanPath === "") {
            return Response.redirect(FRONTEND_URL, 301);
        }

        // 2. Handle POST /api/shorten (Create Link)
        if (request.method === "POST" && cleanPath === "/api/shorten") {
            try {
                const payload = await request.json(); 
                const longUrl = payload.longUrl;
                const customSlug = payload.customSlug;

                if (!longUrl || longUrl.length < 5) {
                    return new Response("Invalid URL", { status: 400, headers: corsHeaders });
                }

                let shortKey;

                // Handle Custom Slug
                if (customSlug) {
                    const existingUrl = await env.LINKS.get(customSlug);
                    if (existingUrl) {
                        return new Response("Custom slug is already taken.", { status: 409, headers: corsHeaders });
                    }
                    shortKey = customSlug;
                } else {
                    // Generate Random Key
                    shortKey = generateRandomString(SHORT_KEY_LENGTH);
                    // Ideally check for collision here in a loop
                }
                
                // Save with TTL
                await env.LINKS.put(shortKey, longUrl, { expirationTtl: ONE_WEEK_TTL });

                return new Response(JSON.stringify({ shortKey }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 201
                });

            } catch (err) {
                return new Response("Error: " + err.message, { status: 500, headers: corsHeaders });
            }
        }
        
        // 3. Handle GET /{key} (Redirection)
        // FIX: We removed the length check. Any GET request not matching above is treated as a key lookup.
        if (request.method === "GET") {
            const key = cleanPath.slice(1); // Remove leading slash
            
            const longUrl = await env.LINKS.get(key);
            
            if (longUrl) {
                return Response.redirect(longUrl, 301);
            } else {
                return new Response("Link Not Found (404)", { status: 404, headers: corsHeaders });
            }
        }

        return new Response("Unknown API Path", { headers: corsHeaders, status: 404 });
    },
};

function generateRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}