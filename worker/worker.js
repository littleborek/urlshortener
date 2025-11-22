
const FRONTEND_URL = "https://short.berkk.cloud"; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Max-Age": "86400", 
      "Access-Control-Allow-Headers": "Content-Type", 
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff"
    };


    if (path === "/" || path === "/index.html") {
        return Response.redirect(FRONTEND_URL, 301);
    }


    if (request.method === "OPTIONS") {
      return new Response(null, { 
          status: 204, 
          headers: corsHeaders 
      });
    }


    if (request.method === "POST" && path === "/api/shorten") {
      try {
        const longUrl = await request.text();

 
        if (!longUrl || longUrl.length < 5) {
          return new Response("Geçersiz URL", { status: 400, headers: corsHeaders });
        }


        const shortKey = generateRandomString(6);
        

        await env.LINKS.put(shortKey, longUrl);


        return new Response(JSON.stringify({ shortKey: shortKey }), {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
          status: 201
        });

      } catch (err) {

        return new Response("Sunucu Hatası: " + err.message, { status: 500, headers: corsHeaders });
      }
    }
    

    if (request.method === "GET" && path.startsWith("/r/")) {
      const key = path.split("/")[2]; 
      

      const longUrl = await env.LINKS.get(key);
      
      if (longUrl) {

        return Response.redirect(longUrl, 301);
      } else {

        return new Response("Link Bulunamadı (404)", { status: 404, headers: corsHeaders });
      }
    }

    return new Response("Bilinmeyen API Yolu", { headers: corsHeaders, status: 404 });
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