import type { ReactNode } from "react";

export interface DocumentIdentityView {
  registrationIdentifier: string;
  verificationPath: string;
  qrDataUri: string;
  barcodeDataUri: string;
}

export interface DocumentField { label: string; value: string; }

export function Header({ reference, date, title, logoDataUri }: { reference: string; date: string; title: string; logoDataUri?: string }): ReactNode {
  return <header className="document-header"><div className="brand">{logoDataUri ? <img src={logoDataUri} alt="" /> : null}<div><p className="brand-name">BGHUB Kenya</p><p className="brand-subtitle">A division of Bob Grogan Consulting Ltd</p></div></div><div className="header-meta"><strong>{reference}</strong>{date}<br />{title}</div></header>;
}

export function Footer({ verificationPath }: { verificationPath: string }): ReactNode { return <footer className="document-footer"><span>BGHUB Kenya | Bob Grogan Consulting Ltd</span><span>Verify: {verificationPath}</span></footer>; }

export function InformationCard({ fields }: { fields: DocumentField[] }): ReactNode { return <div className="information-card"><div className="information-grid">{fields.map((field) => <div key={field.label}><span className="field-label">{field.label}</span><span className="field-value">{field.value}</span></div>)}</div></div>; }

export function VerificationPanel({ identity }: { identity: DocumentIdentityView }): ReactNode {
  return <section className="verification-panel"><div className="verification-copy"><h2>Document verification</h2><p className="identifier">{identity.registrationIdentifier}</p><p>Scan the QR code or visit {identity.verificationPath} to verify this document.</p><img className="barcode" src={identity.barcodeDataUri} alt={`Barcode for ${identity.registrationIdentifier}`} /></div><img className="qr" src={identity.qrDataUri} alt={`QR code for ${identity.registrationIdentifier}`} /></section>;
}

export function SignatureBlock({ label, details }: { label: string; details?: string[] }): ReactNode { return <div className="signature-block"><div className="caption">{label}</div><div className="line" />{details?.map((detail) => <div className="detail" key={detail}>{detail}</div>)}</div>; }

export function SectionTitle({ children, number }: { children: ReactNode; number?: string }): ReactNode { return <h2 className="section-title">{number ? <span className="section-number">{number}</span> : null}{children}</h2>; }

export function Section({ title, number, children }: { title: string; number?: string; children: ReactNode }): ReactNode { return <section className="section"><SectionTitle number={number}>{title}</SectionTitle>{children}</section>; }

export function DocumentShell({ children }: { children: ReactNode }): ReactNode { return <main className="document">{children}</main>; }