"use client";

/**
 * The outermost safety net — catches an error thrown by [locale]/layout.tsx
 * itself (font loading, next-intl setup, etc.), which [locale]/error.tsx
 * can NOT catch since that layout is its own parent. Next.js requires
 * this file to render its own complete <html>/<body> (it fully replaces
 * the root layout on failure), which also means there's no
 * NextIntlClientProvider available here — so this stays deliberately
 * plain and dependency-free rather than reaching for translations or
 * even the app's own Tailwind setup, both of which may be exactly
 * what's broken.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          background: "#ffffff",
          color: "#1f2430",
        }}
      >
        <p style={{ fontSize: 36, margin: 0 }}>⚠️</p>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          تشتەک خەلەت چوو / Something went wrong
        </p>
        <button
          onClick={reset}
          style={{
            borderRadius: 999,
            border: "none",
            background: "#7c3aed",
            color: "#fff",
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          دووبارە هەوڵ بدە / Try again
        </button>
      </body>
    </html>
  );
}
