/** API route that sends contact emails via server-side SMTP (see api/send-contact.ts). */
const CONTACT_FORM_API_PATH = "/api/send-contact";

export type ContactFormData = {
  fullName: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  message: string;
};

/** Submit contact form to the backend API, which then sends via SMTP. */
export async function submitContactForm(data: ContactFormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(CONTACT_FORM_API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `Request failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: message };
  }
}
