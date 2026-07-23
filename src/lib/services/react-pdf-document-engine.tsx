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

export function buildReactPdfDocument(
  documentType: SupportedDocumentType,
  payload: object,
  context: ReactPdfTemplateContext,
  identity: ReactPdfIdentityView,
  logoDataUri?: string,
): ReactElement {
  if (documentType === "PROVISIONAL_ADMISSION_LETTER") {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <AdmissionLetterDocument
            payload={payload as ProvisionalAdmissionLetterPayload}
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
            identity={identity}
            logoDataUri={logoDataUri}
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
  const reference = `BGHUB-ADM-${new Date(context.generatedAt).getFullYear()}-${context.registrationIdentifier.match(/-(\d{5})$/)?.[1] ?? "00001"}`;

  return (
    <View>
      <DocumentHeader reference={reference} date={context.generatedAt} title="Provisional admission" logoDataUri={logoDataUri} />
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Official programme correspondence</Text>
        <Text style={styles.heroTitle}>Provisional Admission to the BGHUB Mentorship Programme</Text>
        <Text style={styles.heroNote}>Issued to {payload.recipientName} | Registration status: Provisional</Text>
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
        <Text style={styles.prose}>We are pleased to inform you that your application to join the BGHUB Mentorship Programme has been provisionally accepted, subject to payment of the prescribed registration fee.</Text>
        <Text style={styles.prose}>You have been allocated the following Provisional Registration Number, which also serves as your payment account number for registration purposes.</Text>
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

      <Section title="Payment instructions">
        <Text style={styles.prose}>Pay via M-PESA Paybill</Text>
        <Text style={styles.prose}>Business Name: Bob Grogan Consulting Ltd</Text>
        <Text style={styles.prose}>Paybill Number: 4148891</Text>
        <Text style={styles.prose}>Account Number: Your Provisional Registration Number (Example: CM-KE-00025 or BM-KE-00018)</Text>
        <Text style={styles.prose}>Kindly ensure that the Account Number entered during payment exactly matches your provisional registration number.</Text>
        <Text style={styles.prose}>Pay via Bank</Text>
        <Text style={styles.prose}>Business Name: Bob Grogan Consulting Ltd</Text>
        <Text style={styles.prose}>KCB Bank, Account Number 1317224973, Machakos Branch</Text>
      </Section>

      <Section title="Confirmation of admission">
        <Text style={styles.prose}>Upon successful receipt and verification of your registration payment:</Text>
        <Text style={styles.listItem}>Your provisional registration number shall become your permanent BGHUB Registration Number.</Text>
        <Text style={styles.listItem}>Your admission shall be formally confirmed.</Text>
        <Text style={styles.listItem}>An Official Letter of Admission will be sent to your registered email address.</Text>
        <Text style={styles.listItem}>You will receive instructions for onboarding, orientation, and access to the BGHUB Learning and Mentorship Platform.</Text>
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
  identity,
  logoDataUri,
}: {
  payload: TechnicalMentorEngagementLetterPayload;
  context: ReactPdfTemplateContext;
  identity: ReactPdfIdentityView;
  logoDataUri?: string;
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

  const reference = `BGHUB-ENG-${new Date(context.generatedAt).getFullYear()}-${context.registrationIdentifier.match(/-(\d{5})$/)?.[1] ?? "00001"}`;

  return (
    <View>
      <DocumentHeader reference={reference} date={context.generatedAt} title="Technical mentor engagement" logoDataUri={logoDataUri} />
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Professional engagement</Text>
        <Text style={styles.heroTitle}>Letter of Engagement as a Technical Mentor</Text>
        <Text style={styles.heroNote}>Issued to {payload.mentorName} | {payload.technicalArea}</Text>
      </View>

      <Section title="Recipient">
        <InformationCard
          fields={[
            { label: "Name", value: payload.mentorName },
            { label: "Email", value: payload.email },
            { label: "Registration number", value: context.registrationIdentifier },
          ]}
        />
        <Text style={styles.prose}>Dear {payload.mentorName},</Text>
      </Section>

      <Section title="Engagement statement">
        <Text style={styles.prose}>On behalf of Bob Grogan Consulting Ltd, I am pleased to engage you as a Technical Mentor at BGHUB Kenya, a division of Bob Grogan Consulting Ltd.</Text>
        <Text style={styles.prose}>BGHUB exists to develop highly competent professionals through structured workplace learning, technical mentorship, research, innovation, entrepreneurship, and digital transformation. As a Technical Mentor, you will play a strategic role in nurturing talent and preparing trainees for productive careers and professional practice.</Text>
        <Text style={styles.prose}>This letter sets out the terms and conditions of your engagement.</Text>
      </Section>

      <Section title="1" number="1">
        <Text style={styles.prose}>Nature of engagement</Text>
        <Text style={styles.prose}>Your engagement is on an independent consultancy basis and shall not be construed as creating an employer-employee relationship. Nothing in this agreement shall entitle you to employee benefits unless expressly agreed in writing.</Text>
        <Text style={styles.prose}>You shall provide mentorship services as and when assigned by BGHUB.</Text>
      </Section>

      <Section title="2" number="2">
        <Text style={styles.prose}>Commencement</Text>
        <Text style={styles.prose}>This engagement shall commence on {context.generatedAt} and shall remain in force until terminated by either party in accordance with this agreement.</Text>
      </Section>

      <Section title="3" number="3">
        <Text style={styles.prose}>Purpose of the engagement</Text>
        <Text style={styles.prose}>The purpose of this engagement is to provide high-quality technical mentorship that equips trainees with practical competencies, professional ethics, industry exposure, and workplace readiness.</Text>
      </Section>

      <Section title="4" number="4">
        <Text style={styles.prose}>Duties and responsibilities</Text>
        <Text style={styles.prose}>As a Technical Mentor, you shall:</Text>
        {duties.map((duty) => (
          <Text style={styles.listItem} key={duty}>{duty}</Text>
        ))}
      </Section>

      <Section title="5" number="5">
        <Text style={styles.prose}>Areas of technical mentorship</Text>
        <Text style={styles.prose}>{payload.technicalArea || "Human Resource Management"}</Text>
      </Section>

      <Section title="6" number="6">
        <Text style={styles.prose}>Performance expectation</Text>
        {expectations.map((expectation) => (
          <Text style={styles.listItem} key={expectation}>{expectation}</Text>
        ))}
      </Section>

      <Section title="7" number="7">
        <Text style={styles.prose}>Confidentiality and professional conduct</Text>
        <Text style={styles.prose}>You shall maintain confidentiality regarding trainee information, programme materials, and proprietary information of BGHUB and Bob Grogan Consulting Ltd, except where disclosure is required by law or authorized by BGHUB.</Text>
      </Section>

      <Section title="8" number="8">
        <Text style={styles.prose}>Reporting and communication</Text>
        <Text style={styles.prose}>You shall provide mentorship reports and updates as required by BGHUB and shall participate in programme reviews, assessments, and feedback sessions when requested.</Text>
      </Section>

      <Section title="9" number="9">
        <Text style={styles.prose}>Term and termination</Text>
        <Text style={styles.prose}>Either party may terminate this engagement upon reasonable notice, subject to the need to protect the continuity of programme delivery and trainee welfare.</Text>
      </Section>

      <Section title="10" number="10">
        <Text style={styles.prose}>Acceptance</Text>
        <Text style={styles.prose}>Please confirm your acceptance of this engagement by signing and returning a copy of this letter to BGHUB.</Text>
      </Section>

      <VerificationPanel identity={identity} />
      <DocumentFooter verificationPath={context.verificationPath} />
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
        <Image src={identity.barcodeDataUri} style={styles.barcode} />
      </View>
      <Image src={identity.qrDataUri} style={styles.qrCode} />
    </View>
  );
}

function DocumentHeader({ reference, date, title, logoDataUri }: { reference: string; date: string; title: string; logoDataUri?: string }): ReactElement {
  return (
    <View style={styles.header}>
      <View style={styles.brandArea}>
        {logoDataUri ? <Image src={logoDataUri} style={styles.logo} /> : null}
        <View>
          <Text style={styles.brandName}>BGHUB Kenya</Text>
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
      <Text style={styles.footerText}>BGHUB Kenya | Bob Grogan Consulting Ltd</Text>
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
