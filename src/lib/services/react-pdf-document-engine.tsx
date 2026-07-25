import type { ReactElement, ReactNode } from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  MenteeProfilePayload,
  ProvisionalAdmissionLetterPayload,
  SupportedDocumentType,
  TechnicalMentorEngagementLetterPayload,
} from "./document-generation";

export interface ReactPdfIdentityView {
  registrationIdentifier: string;
  verificationPath: string;
  qrDataUri: string;
  barcodeDataUri: string;
}

export interface ReactPdfTemplateContext {
  documentType: SupportedDocumentType;
  registrationIdentifier: string;
  verificationPath: string;
  generatedAt: string;
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.getDate();
  const ordinal = day % 100 >= 11 && day % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][day % 10] ?? "th";
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  const year = date.getFullYear();
  return `${day}${ordinal} ${month} ${year}`;
}

export function buildReactPdfDocument(
  documentType: SupportedDocumentType,
  payload: object,
  context: ReactPdfTemplateContext,
  identity: ReactPdfIdentityView,
  logoDataUri?: string,
): ReactElement {
  if (
    documentType === "PROVISIONAL_ADMISSION_LETTER" ||
    documentType === "OFFICIAL_ADMISSION_LETTER"
  ) {
    const admissionPayload = {
      ...(payload as ProvisionalAdmissionLetterPayload),
      isOfficialAdmission: documentType === "OFFICIAL_ADMISSION_LETTER",
    };

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <AdmissionLetterDocument
            payload={admissionPayload as ProvisionalAdmissionLetterPayload}
            context={context}
            identity={identity}
            logoDataUri={logoDataUri}
          />
        </Page>
      </Document>
    );
  }

  if (documentType === "TECHNICAL_MENTOR_ENGAGEMENT_LETTER") {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <MentorLetterDocument
            payload={payload as TechnicalMentorEngagementLetterPayload}
            context={context}
          />
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <MenteeProfileDocument
          payload={payload as MenteeProfilePayload}
          context={context}
          identity={identity}
          logoDataUri={logoDataUri}
        />
      </Page>
    </Document>
  );
}

function AdmissionLetterDocument({
  payload,
  context,
  identity,
  logoDataUri,
}: {
  payload: ProvisionalAdmissionLetterPayload;
  context: ReactPdfTemplateContext;
  identity: ReactPdfIdentityView;
  logoDataUri?: string;
}): ReactElement {
  const validityHours = payload.registrationValidityHours ?? 24;
  const isOfficial = payload.isOfficialAdmission ?? false;
  const reference = `BGHUB-ADM-${new Date(context.generatedAt).getFullYear()}-${context.registrationIdentifier.match(/-(\d{5})$/)?.[1] ?? "00001"}`;
  const title = isOfficial ? "Official admission" : "Provisional admission";
  const heroTitle = isOfficial
    ? "Official Admission to the BGhub Kenya Mentorship Programme"
    : "Provisional Admission to the BGhub Kenya Mentorship Programme";
  const heroNote = isOfficial
    ? `Issued to ${payload.recipientName} | Registration status: Confirmed`
    : `Issued to ${payload.recipientName} | Registration status: Provisional`;

  return (
    <View>
      <DocumentHeader reference={reference} date={context.generatedAt} title={title} logoDataUri={logoDataUri} />
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Official programme correspondence</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={styles.heroNote}>{heroNote}</Text>
      </View>

      <Section title="Recipient">
        <InformationCard
          fields={[
            { label: "Name", value: payload.recipientName },
            { label: "Email", value: payload.email },
            { label: "Phone", value: payload.phoneNumber },
          ]}
        />
      </Section>

      <Section title="Admission notice">
        <Text style={styles.prose}>Dear {payload.recipientName},</Text>
        <Text style={styles.prose}>
          {isOfficial
            ? "We are pleased to confirm that your payment has been received and your admission to the BGhub Kenya Mentorship Programme is now complete."
            : "We are pleased to inform you that your application to join the BGhub Kenya Mentorship Programme has been provisionally accepted, subject to payment of the prescribed registration fee."}
        </Text>
        <Text style={styles.prose}>
          {isOfficial
            ? "Your registration identifier now serves as your permanent admission reference."
            : "You have been allocated the following Provisional Registration Number, which also serves as your payment account number for registration purposes."}
        </Text>
      </Section>

      <Section title="Registration and payment">
        <InformationCard
          fields={[
            { label: "Provisional registration number", value: context.registrationIdentifier },
            { label: "Track", value: payload.registrationTrack },
            { label: "Payment status", value: payload.paymentStatus ?? "Pending" },
            { label: "Registration fee", value: "Ksh 1,000 (one-time)" },
            { label: "Validity", value: `${validityHours} hours from issuance` },
          ]}
        />
      </Section>

      {isOfficial ? (
        <Section title="Login credentials">
          <InformationCard
            fields={[
              { label: "Login email", value: payload.loginEmail ?? payload.email },
              { label: "Username", value: payload.loginUsername ?? payload.email },
              { label: "Default password", value: payload.defaultPassword ?? "ChangeMe123" },
              { label: "Login URL", value: payload.loginUrl ?? "http://localhost:3000/auth/signin" },
            ]}
          />
          <Text style={styles.prose}>Use these credentials to sign in to the BGhub Kenya platform. You will be prompted to change your password immediately after your first sign-in.</Text>
        </Section>
      ) : null}

      <Section title="Payment instructions">
        <Text style={styles.prose}>Pay via M-PESA Paybill</Text>
        <Text style={styles.prose}>Business Name: BGhub Kenya</Text>
        <Text style={styles.prose}>Paybill Number: 4148891</Text>
        <Text style={styles.prose}>Account Number: Your Provisional Registration Number (Example: CM-KE-00025 or BM-KE-00018)</Text>
        <Text style={styles.prose}>Kindly ensure that the Account Number entered during payment exactly matches your provisional registration number.</Text>
        <Text style={styles.prose}>Pay via Bank</Text>
        <Text style={styles.prose}>Business Name: BGhub Kenya</Text>
        <Text style={styles.prose}>KCB Bank, Account Number 1317224973, Machakos Branch</Text>
      </Section>

      <Section title="Confirmation of admission">
        <Text style={styles.prose}>Upon successful receipt and verification of your registration payment:</Text>
        <Text style={styles.listItem}>Your provisional registration number shall become your permanent BGhub Kenya Registration Number.</Text>
        <Text style={styles.listItem}>Your admission shall be formally confirmed.</Text>
        <Text style={styles.listItem}>An official letter of admission will be sent to your registered email address.</Text>
        <Text style={styles.listItem}>You will receive instructions for onboarding, orientation, and access to the BGhub Kenya Learning and Mentorship Platform.</Text>
      </Section>

      <Section title="Important information">
        <Text style={styles.listItem}>The provisional registration number remains valid for 24 hours only.</Text>
        <Text style={styles.listItem}>If payment is not received within this period, the provisional registration shall automatically lapse and the number may be reassigned to another applicant.</Text>
        <Text style={styles.listItem}>Any subsequent application shall be processed as a new application.</Text>
        <Text style={styles.listItem}>Registration fees are non-refundable once admission has been confirmed.</Text>
      </Section>

      <VerificationPanel identity={identity} />
      <DocumentFooter verificationPath={context.verificationPath} />
    </View>
  );
}

function MentorLetterDocument({
  payload,
  context,
}: {
  payload: TechnicalMentorEngagementLetterPayload;
  context: ReactPdfTemplateContext;
}): ReactElement {
  const duties = [
    "Develop competency-based curriculums for various levels of competency",
    "Participate in curriculum review and programme improvement initiatives.",
    "Provide technical guidance to assigned mentees.",
    "Develop individualized competency development plans.",
    "Deliver structured mentorship sessions physically or virtually.",
    "Guide trainees in workplace assignments and practical projects.",
    "Supervise research, innovation, and entrepreneurship projects where applicable.",
    "Review reports, assignments, business plans, proposals, and other technical outputs.",
    "Conduct competency assessments and provide constructive feedback.",
    "Monitor trainee progress against established learning milestones.",
    "Prepare mentorship reports and submit them within stipulated timelines.",
    "Support networking and linkage of trainees to industry opportunities.",
    "Participate in technical seminars, webinars, conferences, and workshops organized by BGHUB.",
    "Promote innovation, ethical conduct, professionalism, and continuous learning.",
  ];

  const expectations = [
    "Maintain regular communication with assigned trainees.",
    "Complete agreed mentorship sessions.",
    "Meet all reporting deadlines.",
    "Respond to trainee enquiries promptly.",
    "Maintain accurate mentorship records.",
    "Demonstrate professionalism and ethical conduct.",
    "Support trainees in achieving competency-based learning outcomes.",
    "Contribute to continuous improvement of the mentorship programme.",
  ];

  const displayDate = formatDisplayDate(context.generatedAt);
  const referenceNumber = context.registrationIdentifier;
  const technicalAreaValue = payload.technicalArea || "Human Resource Management";

  return (
    <View style={styles.letterPage}>
      <Text style={styles.letterHeading}>BGHUB Kenya</Text>
      <Text style={styles.letterSubtitle}>A Division of Bob Grogan Consulting Ltd</Text>
      <View style={styles.headerRow}>
        <Text style={styles.prose}>Ref: {referenceNumber}</Text>
        <Text style={styles.prose}>Date: {displayDate}</Text>
      </View>
      <View style={styles.headerRow}>
        <Text style={styles.prose}>To: {payload.mentorName}</Text>
        <Text style={styles.prose}>Email: {payload.email}</Text>
      </View>
      <Text style={styles.prose}>RE: LETTER OF ENGAGEMENT AS A TECHNICAL MENTOR</Text>
      <Text style={styles.prose}>Dear {payload.mentorName},</Text>
      <Text style={styles.prose}>On behalf of Bob Grogan Consulting Ltd, I am pleased to engage you as a Technical Mentor at BGHUB Kenya, a division of Bob Grogan Consulting Ltd.</Text>
      <Text style={styles.prose}>BGHUB exists to develop highly competent professionals through structured workplace learning, technical mentorship, research, innovation, entrepreneurship, and digital transformation. As a Technical Mentor, you will play a strategic role in nurturing talent and preparing trainees for productive careers and professional practice.</Text>
      <Text style={styles.prose}>This letter sets out the terms and conditions of your engagement.</Text>

      <Text style={styles.sectionTitle}>1. Nature of Engagement</Text>
      <Text style={styles.prose}>Your engagement is on an independent consultancy basis and shall not be construed as creating an employer-employee relationship. Nothing in this agreement shall entitle you to employee benefits unless expressly agreed in writing.</Text>
      <Text style={styles.prose}>You shall provide mentorship services as and when assigned by BGHUB.</Text>

      <Text style={styles.sectionTitle}>2. Commencement</Text>
      <Text style={styles.prose}>This engagement shall commence on {displayDate} and shall remain in force until terminated by either party in accordance with this agreement.</Text>

      <Text style={styles.sectionTitle}>3. Purpose of the Engagement</Text>
      <Text style={styles.prose}>The purpose of this engagement is to provide high-quality technical mentorship that equips trainees with practical competencies, professional ethics, industry exposure, and workplace readiness.</Text>

      <Text style={styles.sectionTitle}>4. Duties and Responsibilities</Text>
      <Text style={styles.prose}>As a Technical Mentor, you shall:</Text>
      {duties.map((duty) => (
        <Text style={styles.listItem} key={duty}>{duty}</Text>
      ))}

      <Text style={styles.sectionTitle}>5. Areas of Technical Mentorship</Text>
      <Text style={styles.prose}>{technicalAreaValue}</Text>

      <Text style={styles.sectionTitle}>6. Performance Expectations</Text>
      {expectations.map((expectation) => (
        <Text style={styles.listItem} key={expectation}>{expectation}</Text>
      ))}

      <Text style={styles.sectionTitle}>7. Confidentiality</Text>
      <Text style={styles.prose}>You shall treat all information relating to Bob Grogan Consulting Ltd, BGHUB, clients, trainees, partners, research activities, business operations, intellectual property, and financial information as confidential.</Text>
      <Text style={styles.prose}>You shall not disclose such information without prior written authorization.</Text>
      <Text style={styles.prose}>This obligation shall survive termination of this engagement.</Text>

      <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
      <Text style={styles.prose}>Any manuals, curricula, assessment tools, reports, software, templates, presentations, research outputs, training materials, or other works developed specifically for BGHUB under this engagement shall become the property of Bob Grogan Consulting Ltd unless otherwise agreed in writing.</Text>
      <Text style={styles.prose}>You shall retain ownership of intellectual property created independently prior to this engagement.</Text>

      <Text style={styles.sectionTitle}>9. Conflict of Interest</Text>
      <Text style={styles.prose}>You shall disclose any actual or potential conflict of interest that may affect your ability to discharge your responsibilities impartially.</Text>

      <Text style={styles.sectionTitle}>10. Professional Conduct</Text>
      <Text style={styles.prose}>You agree to uphold the highest standards of Integrity, Professionalism, Respect, Accountability, Confidentiality, Non-discrimination and Ethical conduct.</Text>
      <Text style={styles.prose}>You shall comply with all BGHUB policies, procedures, and professional standards.</Text>

      <Text style={styles.sectionTitle}>11. Honoraria</Text>
      <Text style={styles.prose}>BGHUB Kenya treats mentorship as a way of giving back to society. As such, technical mentorship fee is highly subsidized to ensure affordability to mentees.</Text>
      <Text style={styles.prose}>Mentees shall be charged a technical mentorship fee based on level of competency from beginner, intermediate and advanced.</Text>
      <Text style={styles.prose}>All mentorship assignments will be supported by Local Service Orders (LSOs) clearly stipulating the honoraria, scope of work, timelines and deliverables.</Text>
      <Text style={styles.prose}>The mentorship fee will be shared between BGHUB Kenya and the mentor in the ratio of 20:80.</Text>
      <Text style={styles.prose}>The amount payable to a mentor shall be subject to withholding taxes.</Text>
      <Text style={styles.prose}>It will be the responsibility of mentors to declare and pay income taxes due to the Kenya Revenue Authority.</Text>

      <Text style={styles.sectionTitle}>12. Reporting Relationship</Text>
      <Text style={styles.prose}>For all mentorship assignments, you shall report to the Director, BGHUB Kenya, or such other officer as may be designated by the Director.</Text>

      <Text style={styles.sectionTitle}>13. Working Arrangements</Text>
      <Text style={styles.prose}>Mentorship activities may be conducted physically or virtually through the BGHUB Learning Platform or partner institutions or workshops.</Text>

      <Text style={styles.sectionTitle}>14. Duration and Renewal</Text>
      <Text style={styles.prose}>This engagement shall remain valid until terminated by either party.</Text>
      <Text style={styles.prose}>Continuation of assignments shall depend upon programme needs, availability of mentorship opportunities, your performance and compliance with BGHUB standards.</Text>

      <Text style={styles.sectionTitle}>15. Termination</Text>
      <Text style={styles.prose}>Either party may terminate this engagement by giving thirty (30) days&apos; written notice.</Text>
      <Text style={styles.prose}>Bob Grogan Consulting Ltd reserves the right to terminate this engagement immediately in the event of gross misconduct, professional negligence, breach of confidentiality, fraud or dishonesty, conflict of interest, poor professional conduct or any act that may bring BGHUB or Bob Grogan Consulting Ltd into disrepute.</Text>

      <Text style={styles.sectionTitle}>16. Governing Law</Text>
      <Text style={styles.prose}>This engagement shall be governed by the laws of the Republic of Kenya.</Text>

      <Text style={styles.sectionTitle}>17. Acceptance</Text>
      <Text style={styles.prose}>Kindly indicate your acceptance of this engagement by signing and returning a copy of this letter.</Text>
      <Text style={styles.prose}>We welcome you to the BGHUB Technical Mentorship Network and look forward to your contribution towards developing competent professionals who will transform organizations and strengthen health systems in Kenya and across Africa.</Text>

      <Text style={styles.prose}>For: Bob Grogan Consulting Ltd</Text>
      <Text style={styles.prose}>Name __________________________________________ Designation ____________________</Text>
      <Text style={styles.prose}>Signature: _______________________________ Date: _______________________________</Text>

      <Text style={styles.sectionTitle}>ACCEPTANCE BY THE TECHNICAL MENTOR</Text>
      <Text style={styles.prose}>I, _______________________________________________, accept my engagement as a Technical Mentor at BGHUB Kenya, a division of Bob Grogan Consulting Ltd, on the terms and conditions contained in this Letter of Engagement.</Text>
      <Text style={styles.prose}>Signature: __________________________________ Date: _______________________________</Text>
      <Text style={styles.prose}>National ID/Passport No.: _______________________ Telephone: _____________________ Email _________________________________________________</Text>
    </View>
  );
}

function MenteeProfileDocument({
  payload,
  context,
  identity,
  logoDataUri,
}: {
  payload: MenteeProfilePayload;
  context: ReactPdfTemplateContext;
  identity: ReactPdfIdentityView;
  logoDataUri?: string;
}): ReactElement {
  const reference = `BGHUB-PRF-${new Date(context.generatedAt).getFullYear()}-${context.registrationIdentifier.match(/-(\d{5})$/)?.[1] ?? "00001"}`;

  return (
    <View>
      <DocumentHeader reference={reference} date={context.generatedAt} title="Mentee profile" logoDataUri={logoDataUri} />
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Programme record</Text>
        <Text style={styles.heroTitle}>Mentee Profile</Text>
      </View>

      <Section title="Profile summary">
        <InformationCard
          fields={[
            { label: "Full name", value: payload.fullName },
            { label: "Email", value: payload.email },
            { label: "Phone", value: payload.phoneNumber },
          ]}
        />
      </Section>

      <Section title="Registration details">
        <InformationCard
          fields={[
            { label: "Registration number", value: context.registrationIdentifier },
            { label: "Mentorship track", value: payload.mentorshipTrack },
            { label: "Date registered", value: payload.dateRegistered ?? context.generatedAt },
            { label: "Registration status", value: payload.registrationStatus ?? "Provisional" },
            { label: "Payment status", value: payload.paymentStatus ?? "Pending" },
          ]}
        />
      </Section>

      <VerificationPanel identity={identity} />
      <DocumentFooter verificationPath={context.verificationPath} />
    </View>
  );
}

function Section({ title, number, children }: { title: string; number?: string; children: ReactNode }): ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {number ? `${number}. ` : ""}
        {title}
      </Text>
      {children}
    </View>
  );
}

function InformationCard({ fields }: { fields: Array<{ label: string; value: string }> }): ReactElement {
  return (
    <View style={styles.card}>
      {fields.map((field) => (
        <View style={styles.cardRow} key={`${field.label}:${field.value}`}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <Text style={styles.fieldValue}>{field.value}</Text>
        </View>
      ))}
    </View>
  );
}

function VerificationPanel({ identity }: { identity: ReactPdfIdentityView }): ReactElement {
  return (
    <View style={styles.verificationPanel}>
      <View style={styles.verificationColumn}>
        <Text style={styles.sectionTitle}>Document verification</Text>
        <Text style={styles.identifier}>{identity.registrationIdentifier}</Text>
        <Text style={styles.prose}>Scan the QR code or visit {identity.verificationPath} to verify this document.</Text>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={identity.barcodeDataUri} style={styles.barcode} />
      </View>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={identity.qrDataUri} style={styles.qrCode} />
    </View>
  );
}

function DocumentHeader({ reference, date, title, logoDataUri }: { reference: string; date: string; title: string; logoDataUri?: string }): ReactElement {
  return (
    <View style={styles.header}>
      <View style={styles.brandArea}>
        {logoDataUri ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoDataUri} style={styles.logo} />
          </>
        ) : null}
        <View>
          <Text style={styles.brandName}>BGhub Kenya</Text>
          <Text style={styles.brandSubTitle}>A division of Bob Grogan Consulting Ltd</Text>
        </View>
      </View>
      <View style={styles.metaArea}>
        <Text style={styles.reference}>{reference}</Text>
        <Text style={styles.metaText}>Date: {date}</Text>
        <Text style={styles.metaText}>{title}</Text>
      </View>
    </View>
  );
}

function DocumentFooter({ verificationPath }: { verificationPath: string }): ReactElement {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>BGhub Kenya | Bob Grogan Consulting Ltd</Text>
      <Text style={styles.footerText}>Verify: {verificationPath}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    backgroundColor: "#f8fafc",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#d8dee9",
  },
  brandArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 64,
    height: 64,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  brandSubTitle: {
    fontSize: 9,
    color: "#475569",
  },
  metaArea: {
    alignItems: "flex-end",
  },
  reference: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 10,
    color: "#334155",
  },
  heroBlock: {
    padding: 12,
    backgroundColor: "#e2e8f0",
    marginBottom: 12,
    borderRadius: 10,
  },
  eyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#0f172a",
    marginBottom: 6,
    fontWeight: "bold",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  heroNote: {
    fontSize: 10,
    color: "#1f2937",
  },
  section: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
  },
  letterPage: {
    padding: 10,
    backgroundColor: "#ffffff",
  },
  letterHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  letterSubtitle: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#d9e2f2",
    borderRadius: 6,
    backgroundColor: "#f8fbff",
    padding: 8,
  },
  cardRow: {
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
    fontWeight: "bold",
  },
  fieldValue: {
    fontSize: 10,
    color: "#0f172a",
  },
  prose: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#18212f",
    marginBottom: 5,
  },
  listItem: {
    fontSize: 10,
    lineHeight: 1.45,
    color: "#18212f",
    marginBottom: 4,
    marginLeft: 10,
  },
  verificationPanel: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#e2e8f0",
    padding: 10,
    borderRadius: 8,
  },
  verificationColumn: {
    flex: 1,
  },
  identifier: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  qrCode: {
    width: 90,
    height: 90,
    marginLeft: 12,
  },
  barcode: {
    width: 180,
    height: 60,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#d8dee9",
  },
  footerText: {
    fontSize: 9,
    color: "#475569",
  },
});
