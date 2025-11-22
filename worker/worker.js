/**
 * Cloudflare Worker - URL Shortener API
 * * Required Bindings: KV Namespace (LINKS)
 */

// Frontend URL for redirection
const FRONTEND_URL = "https://short.berkk.cloud"; 
const SHORT_KEY_LENGTH = 4; // Key length reduced to 4

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Clean path (remove trailing slash if any)
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
    
    // Handle CORS preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, { 
          status: 204, 
          headers: corsHeaders 
      });
    }

    // Handle POST /api/shorten
    if (request.method === "POST" && cleanPath === "/api/shorten") {
      try {
        const longUrl = await request.text();

        // Basic validation
        if (!longUrl || longUrl.length < 5) {
          return new Response("Invalid URL", { status: 400, headers: corsHeaders });
        }

        // Generate 4-char key
        const shortKey = generateRandomString(SHORT_KEY_LENGTH);
        
        // Save to KV store
        await env.LINKS.put(shortKey, longUrl);

        // Success response
        return new Response(JSON.stringify({ shortKey: shortKey }), {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
          status: 201
        });

      } catch (err) {
        // Error response with CORS headers
        return new Response("Server Error: " + err.message, { status: 500, headers: corsHeaders });
      }
    }
    
    // Handle GET /{key} redirection (Key length = 4, so path length = 5: /ABCD)
    // Worker now listens on the root path for 4-character keys
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