const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong. Please try again.");
    error.status = response.status;
    error.fields = data.fields ?? {};
    throw error;
  }

  return data;
}

export const api = {
  getEvents: () => request("/events").then((data) => data.events),
  createEvent: (event) =>
    request("/events", {
      method: "POST",
      body: JSON.stringify(event),
    }).then((data) => data.event),
  deleteEvent: (id) => request(`/events/${id}`, { method: "DELETE" }),
  getRegistrations: () =>
    request("/registrations").then((data) => data.registrations),
  createRegistration: (registration) =>
    request("/registrations", {
      method: "POST",
      body: JSON.stringify(registration),
    }).then((data) => data.registration),
  getStats: () => request("/stats"),
};
