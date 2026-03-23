import { Layout } from "@/components/Layout";
import { COMPANY } from "@/lib/constants";

export default function PrivacyPage() {
  return (
    <Layout>
      <section className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-[#F5F7FA] p-8 shadow-soft-xl sm:p-11">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">HapyJo Ltd Legal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
            We respect your data the same way we respect your work - with clarity, accountability, and care.
          </p>
          <p className="mt-5 text-sm leading-8 text-slate-700 sm:text-base">
            This Privacy Policy explains how {COMPANY.name} collects, uses, stores, and protects personal and
            operational data when you use our mobile application and related services. The app is designed for business
            operations in construction and fleet workflows.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            Last updated: March 23, 2026
            <br />
            Company: {COMPANY.name}
          </p>
        </div>

        <div className="mt-10 space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft-xl sm:p-11">
          <PolicySection title="1. Information we collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>Account information such as name, email address, role, and company assignment.</li>
              <li>Operational records such as sites, trips, surveys, expenses, approvals, and reports.</li>
              <li>
                Location data (GPS coordinates) collected during active trip or field activity tracking where enabled.
              </li>
              <li>Camera images and uploaded photos used as work evidence, issue logs, and verification records.</li>
              <li>Notification tokens and delivery metadata for in-app, realtime, and push notifications.</li>
              <li>Technical data such as device type, app version, and diagnostic logs for service reliability.</li>
            </ul>
          </PolicySection>

          <PolicySection title="2. How we use your information">
            <ul className="list-disc space-y-2 pl-5">
              <li>To authenticate users and enforce role-based access controls.</li>
              <li>To operate site, fleet, trip, survey, and expense workflows.</li>
              <li>To support approvals, alerts, audits, and operational accountability.</li>
              <li>To generate performance and financial reports for authorized company users.</li>
              <li>To secure, maintain, and improve app quality and reliability.</li>
            </ul>
          </PolicySection>

          <PolicySection title="3. Location data usage">
            <p>
              Location data is used to support trip and field activity verification. We collect this data only for
              relevant business workflows and only for authorized users. Location collection may occur while a trip or
              related operational process is active.
            </p>
          </PolicySection>

          <PolicySection title="4. Camera and photo data">
            <p>
              Camera access is used to capture work evidence, issue documentation, and other operational proof required
              by your organization. Images may be stored in secure cloud infrastructure and linked to operational
              records.
            </p>
          </PolicySection>

          <PolicySection title="5. Notifications">
            <p>
              We use in-app, realtime, and push notifications to inform users about assignments, approvals, rejections,
              workflow updates, and critical operational events.
            </p>
          </PolicySection>

          <PolicySection title="6. Third-party services">
            <p>We use trusted third-party providers to operate the app, including:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Supabase (authentication, database, storage)</li>
              <li>Expo (push notifications)</li>
              <li>OpenStreetMap (location services)</li>
            </ul>
            <p className="mt-3">
              These providers process data only as necessary to provide their services.
            </p>
          </PolicySection>

          <PolicySection title="7. App permissions">
            <p>The app may request the following permissions:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Location - to track trips and field activity</li>
              <li>Camera - to capture work evidence</li>
              <li>Storage - to upload and store images</li>
              <li>Notifications - to send alerts and updates</li>
            </ul>
            <p className="mt-3">Permissions are only used for core functionality.</p>
          </PolicySection>

          <PolicySection title="8. Lawful basis and business purpose">
            <p>
              Data processing is performed for legitimate business operations, contract performance, and service
              administration between {COMPANY.name} and its clients or internal teams.
            </p>
          </PolicySection>

          <PolicySection title="9. Data sharing">
            <p>We do not sell personal data. We may share data only with:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Authorized users within your organization according to role permissions.</li>
              <li>Trusted service providers required to run the platform (for example, hosting and notifications).</li>
              <li>Regulators or legal authorities when disclosure is required by law.</li>
            </ul>
          </PolicySection>

          <PolicySection title="10. Data storage and security">
            <ul className="list-disc space-y-2 pl-5">
              <li>Authentication and database services are provided through secured cloud infrastructure.</li>
              <li>Role-based access and database security rules restrict data visibility by authorized role.</li>
              <li>Administrative actions are controlled through server-side checks and audit-friendly workflows.</li>
            </ul>
          </PolicySection>

          <PolicySection title="11. Data retention">
            <p>
              We retain data for as long as necessary to provide services, satisfy contractual obligations, resolve
              disputes, enforce policies, and comply with legal requirements. Retention periods may vary by data type
              and business context.
            </p>
          </PolicySection>

          <PolicySection title="12. Data deletion">
            <p>
              Users may request deletion of their data by contacting us at{" "}
              <a className="font-medium text-blue-700 underline underline-offset-2" href={`mailto:${COMPANY.email}`}>
                {COMPANY.email}
              </a>
              . We process deletion requests in accordance with applicable laws and operational requirements.
            </p>
          </PolicySection>

          <PolicySection title="13. Your rights and choices">
            <ul className="list-disc space-y-2 pl-5">
              <li>Request access to personal data associated with your account.</li>
              <li>Request correction of inaccurate or outdated information.</li>
              <li>Request deletion where legally and operationally permitted.</li>
              <li>Manage device permissions for location, camera, and notifications at OS level.</li>
            </ul>
          </PolicySection>

          <PolicySection title="14. Children's privacy">
            <p>
              Our services are intended for professional users and are not directed to children under 13 years of age.
            </p>
          </PolicySection>

          <PolicySection title="15. International transfers">
            <p>
              Data may be processed in countries where our service providers operate. We apply appropriate safeguards
              and contractual protections for transferred data.
            </p>
          </PolicySection>

          <PolicySection title="16. Policy updates">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be posted on this page with a
              revised effective date.
            </p>
          </PolicySection>

          <PolicySection title="17. Contact us">
            <p>
              For privacy inquiries, data requests, or compliance questions, contact:
              <br />
              {COMPANY.name}
              <br />
              Email:{" "}
              <a className="font-medium text-blue-700 underline underline-offset-2" href={`mailto:${COMPANY.email}`}>
                {COMPANY.email}
              </a>
              <br />
              Phone:{" "}
              <a
                className="font-medium text-blue-700 underline underline-offset-2"
                href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              >
                {COMPANY.phone}
              </a>
            </p>
          </PolicySection>
        </div>
      </section>
    </Layout>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h2>
      <div className="mt-3 text-sm leading-8 text-slate-700 sm:text-base">{children}</div>
    </section>
  );
}
