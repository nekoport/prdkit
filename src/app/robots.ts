import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://prdkit.app";

  return {
    rules: [
      {
        // Allow crawling semua public pages
        userAgent: "*",
        allow: ["/", "/sign-in", "/sign-up", "/terms", "/privacy"],
        // Block private/authenticated routes
        disallow: [
          "/api/*",
          "/admin/*",
          "/dashboard",
          "/new",
          "/prd/*",
          "/account/*",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
