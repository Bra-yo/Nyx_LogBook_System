export const documentStyles = `
  @page { size: A4; margin: 16mm 15mm 18mm; }
  :root { color-scheme: light; --ink: #18232d; --muted: #60707d; --line: #d8e0e5; --paper: #ffffff; --wash: #f3f7f8; --teal: #0b6570; --gold: #bf8a3d; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #e9eef0; color: var(--ink); font-family: Georgia, 'Times New Roman', serif; font-size: 10.5pt; line-height: 1.55; }
  .document { width: 180mm; margin: 0 auto; background: var(--paper); }
  .document-header { border-top: 6px solid var(--teal); border-bottom: 1px solid var(--line); padding: 10px 0 12px; display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 42px; height: 42px; object-fit: contain; }
  .brand-name { margin: 0; color: var(--teal); font-family: Arial, sans-serif; font-size: 15pt; font-weight: 700; letter-spacing: .03em; }
  .brand-subtitle { margin: 2px 0 0; color: var(--muted); font-family: Arial, sans-serif; font-size: 7.5pt; letter-spacing: .06em; text-transform: uppercase; }
  .header-meta { color: var(--muted); font-family: Arial, sans-serif; font-size: 8pt; line-height: 1.5; text-align: right; }
  .header-meta strong { color: var(--ink); display: block; font-size: 9pt; }
  .document-hero { padding: 24px 0 18px; border-bottom: 1px solid var(--line); }
  .eyebrow { margin: 0 0 7px; color: var(--gold); font-family: Arial, sans-serif; font-size: 8pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
  h1 { margin: 0; max-width: 145mm; color: var(--ink); font-size: 25pt; font-weight: 400; line-height: 1.12; }
  .hero-note { margin: 9px 0 0; color: var(--muted); font-family: Arial, sans-serif; font-size: 9pt; }
  .section { margin-top: 19px; break-inside: avoid; }
  .section-title { display: flex; align-items: baseline; gap: 9px; margin: 0 0 9px; color: var(--teal); font-family: Arial, sans-serif; font-size: 10pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .section-title::after { content: ''; height: 1px; flex: 1; background: var(--line); }
  .section-number { color: var(--gold); font-size: 8pt; }
  .information-card { border: 1px solid var(--line); border-left: 3px solid var(--teal); background: var(--wash); padding: 12px 14px; break-inside: avoid; }
  .information-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 18px; }
  .field-label { display: block; color: var(--muted); font-family: Arial, sans-serif; font-size: 7pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .field-value { display: block; margin-top: 2px; color: var(--ink); font-size: 10pt; overflow-wrap: anywhere; }
  .prose { margin: 0; }
  .prose + .prose { margin-top: 9px; }
  .legal-list { margin: 7px 0 0 20px; padding: 0; }
  .legal-list li { padding-left: 4px; margin: 4px 0; }
  .legal-list li::marker { color: var(--gold); }
  .callout { margin-top: 10px; border: 1px solid #e8d9bf; border-left: 3px solid var(--gold); padding: 11px 14px; background: #fffaf2; break-inside: avoid; }
  .callout strong { color: var(--teal); font-family: Arial, sans-serif; font-size: 8pt; letter-spacing: .08em; text-transform: uppercase; }
  .verification-panel { margin-top: 22px; padding: 14px; border: 1px solid var(--line); background: #fbfcfc; display: grid; grid-template-columns: 1fr 34mm; gap: 16px; align-items: center; break-inside: avoid; }
  .verification-copy h2 { margin: 0 0 4px; color: var(--teal); font-family: Arial, sans-serif; font-size: 10pt; letter-spacing: .08em; text-transform: uppercase; }
  .verification-copy p { margin: 3px 0; color: var(--muted); font-family: Arial, sans-serif; font-size: 8pt; }
  .verification-copy .identifier { color: var(--ink); font-size: 13pt; font-weight: 700; letter-spacing: .08em; }
  .qr { width: 28mm; height: 28mm; justify-self: end; }
  .barcode { width: 100%; max-width: 112mm; height: 18mm; margin-top: 9px; object-fit: contain; object-position: left center; }
  .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; break-inside: avoid; }
  .signature-block { min-height: 72px; border-top: 1px solid var(--ink); padding-top: 7px; }
  .signature-block .caption { color: var(--muted); font-family: Arial, sans-serif; font-size: 8pt; }
  .signature-block .line { margin-top: 23px; border-bottom: 1px solid var(--ink); }
  .signature-block .detail { margin-top: 7px; font-family: Arial, sans-serif; font-size: 8pt; }
  .document-footer { margin-top: 24px; padding-top: 9px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; color: var(--muted); font-family: Arial, sans-serif; font-size: 7.5pt; }
  .document-footer span:last-child { text-align: right; }
  .avoid-break { break-inside: avoid; }
  @media print { body { background: white; } .document { width: auto; margin: 0; } }
`;