export const DEFAULT_SECURITY_HEADERS = {
  /*
      Secure your application with Content-Security-Policy headers.       
    
    @@ -192,5 +192,5 @@ async function handleEvent(event) {
  
      Enabling these headers will permit content from a trusted domain and all its subdomains.
      @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
    */
  "Content-Security-Policy": "frame-ancestors 'self';",

  /*
      You can also set Strict-Transport-Security headers.
      These are not automatically set because your website might get added to Chrome's HSTS preload list.
      Here's the code if you want to apply it:
    */
  "Strict-Transport-Security": "max-age=31536000;",

  /*
      Permissions-Policy header provides the ability to allow or deny the use of browser features, such as opting out of FLoC - which you can use below:
      
      //below is possible option for permissions policy. May cause issues with buy so not implemented for now.
      "Permissions-Policy": "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()",
      */
  /*
      X-XSS-Protection header prevents a page from loading if an XSS attack is detected.
      @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
      */
  "X-XSS-Protection": "0",
  /*
      X-Frame-Options header prevents click-jacking attacks.
      @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
      */
  "X-Frame-Options": "DENY",
  /*
      X-Content-Type-Options header prevents MIME-sniffing.
      @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
      */
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Embedder-Policy": 'require-corp; report-to="default";',
  "Cross-Origin-Opener-Policy": 'same-site; report-to="default";',
  "Cross-Origin-Resource-Policy": "same-site",
};
export const BLOCKED_HEADERS = [
  "Public-Key-Pins",
  "X-Powered-By",
  "X-AspNet-Version",
];
export const CORS_HEADERS = { "Access-Control-Allow-Origin": null };
