/**
 * Cloudflare Worker - URL Shortener API
 * * Required Bindings: KV Namespace (LINKS)
 */

// Frontend URL for redirection
const FRONTEND_URL = "https://short.berkk.cloud"; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS and Security Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Max-Age": "86400", 
      "Access-Control-Allow-Headers": "Content-Type", 
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff"
    };

    // Redirect root path to the frontend site
    if (path === "/" || path === "/index.html") {
        return Response.redirect(FRONTEND_URL, 301);
    }

    // Handle CORS preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, { 
          status: 204, 
          headers: corsHeaders 
      });
    }

    // Handle POST /api/shorten
    if (request.method === "POST" && path === "/api/shorten") {
      try {
        const longUrl = await request.text();

        // Basic validation
        if (!longUrl || longUrl.length < 5) {
          return new Response("Invalid URL", { status: 400, headers: corsHeaders });
        }

        // Generate 6-char key
        const shortKey = generateRandomString(6);
        
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
    
    // Handle GET /r/{key} redirection
    if (request.method === "GET" && path.startsWith("/r/")) {
      const key = path.split("/")[2]; // Extract key
      
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