import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 55%, #9a3412 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            <div
              style={{
                width: "108px",
                height: "108px",
                borderRadius: "999px",
                background: "#111827",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <svg width="76" height="76" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="boltOg" x1="22" y1="10" x2="42" y2="53" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#fb923c" />
                    <stop offset="1" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <path d="M36 9L20 34h12l-2 21 14-23H33z" fill="url(#boltOg)" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1.05 }}>ZipDeals</div>
              <div style={{ fontSize: "28px", opacity: 0.92 }}>Local Clearance Deals & Bulk Stock</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "40px", fontWeight: 700, maxWidth: "900px", lineHeight: 1.15 }}>
              Discover genuine clearance deals from verified sellers near you.
            </div>
            <div style={{ fontSize: "24px", opacity: 0.9 }}>
              Direct WhatsApp contact. No middlemen.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
