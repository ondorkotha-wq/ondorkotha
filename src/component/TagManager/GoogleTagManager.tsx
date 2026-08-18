"use client";

import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GTMScript() {
  if (!GTM_ID) return null;

  return (
    <>
      {/* sGTM loader via your first-party domain */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s);j.async=true;j.src='https://tracking.ondorkotha.com/xee4fee1f7889.js';
            f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />

      {/* BonicBD first-party tracker */}
      <Script
        id="bbd-tracker"
        src="https://tracking.ondorkotha.com/m733d7ee048a6.js"
        data-bbd-origin="https://tracking.ondorkotha.com"
        data-bbd-cid="12664"
        strategy="afterInteractive"
      />
    </>
  );
}

export function GTMNoScript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://tracking.ondorkotha.com/h570b71fee265.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
