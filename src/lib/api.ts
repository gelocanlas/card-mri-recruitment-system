export function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("card_mri_token");
  
  // Note: Handle different body or existing Headers object types carefully
  let mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        mergedHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        mergedHeaders[key] = value;
      });
    } else {
      mergedHeaders = { ...mergedHeaders, ...options.headers };
    }
  }

  return fetch(url, {
    ...options,
    headers: mergedHeaders
  }).then(async (response) => {
    if (response.status === 401) {
      localStorage.removeItem("card_mri_token");
      // Trigger a custom event so that React state in App can clean up session
      window.dispatchEvent(new Event("auth_unauthorized"));
    }
    return response;
  });
}
