import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "PRDKit — Generator PRD untuk AI Coding";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #f5f0e8 0%, #faf6f0 50%, #f0e8dc 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(194,90,31,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -150,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(194,90,31,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top brand bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "60px 80px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#c25a1f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                color: "white",
              }}
            >
              P
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#1a1a1a",
                  letterSpacing: -0.5,
                }}
              >
                PRDKit
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#7a7468",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                PRD Studio
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(194,90,31,0.1)",
              border: "1px solid rgba(194,90,31,0.3)",
              fontSize: 14,
              fontWeight: 600,
              color: "#c25a1f",
            }}
          >
            100% Free Forever
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "60px 80px 0",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#1a1a1a",
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ display: "flex" }}>Bikin PRD yang</span>
            <span
              style={{
                display: "flex",
                fontStyle: "italic",
                color: "#c25a1f",
              }}
            >
              AI paham
            </span>
            <span
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 400,
                color: "#5a544a",
                marginTop: 16,
                letterSpacing: -0.5,
              }}
            >
              dalam satu prompt.
            </span>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div
          style={{
            display: "flex",
            padding: "0 80px 60px",
            alignItems: "center",
            gap: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#1a1a1a",
              }}
            >
              10
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#7a7468",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Section per PRD
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 50,
              background: "#d4cdbf",
              display: "flex",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#1a1a1a",
              }}
            >
              &lt;90s
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#7a7468",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Generate time
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 50,
              background: "#d4cdbf",
              display: "flex",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#1a1a1a",
              }}
            >
              Claude
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#7a7468",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Powered by
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
