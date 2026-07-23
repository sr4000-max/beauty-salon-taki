import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/cancel/",
          "/reserve/complete",
          "/tickets/",
        ],
      },
    ],
    sitemap: "https://www.takibs.com/sitemap.xml",
    host: "https://www.takibs.com",
  };
}
