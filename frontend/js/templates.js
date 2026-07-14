function fmtMoney(amount, currency) {
  const symbols = { USD: '$', EUR: '€', GBP: '£', KZT: '₸' };
  const s = symbols[currency] || currency + ' ';
  return `${s}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function paymentTermsText(code, amount, currency, customSplit) {
  const total = fmtMoney(amount, currency);
  const pct = (n) => fmtMoney(amount * n / 100, currency);

  switch (code) {
    case '100_upfront':
      return `100% of the total fee (${total}) is due upfront prior to commencement of work.`;
    case '100_delivery':
      return `100% of the total fee (${total}) is due upon delivery and acceptance of the final work.`;
    case '50/50':
      return `50% (${pct(50)}) is due upon signing, and 50% (${pct(50)}) upon delivery and acceptance.`;
    case '40/60':
      return `40% (${pct(40)}) is due upfront, and 60% (${pct(60)}) upon delivery and acceptance.`;
    case '30/70':
      return `30% (${pct(30)}) is due upfront, and 70% (${pct(70)}) upon delivery and acceptance.`;
    case '10/90':
      return `10% (${pct(10)}) is due upfront as a deposit, and 90% (${pct(90)}) upon final submission and acceptance.`;
    case '25/25/50':
      return `25% (${pct(25)}) upon signing, 25% (${pct(25)}) at project midpoint, and 50% (${pct(50)}) upon completion.`;
    case '33/33/34':
      return `Three equal milestone payments: 33% (${pct(33)}), 33% (${pct(33)}), and 34% (${pct(34)}) at agreed milestones.`;
    case 'monthly':
      return `The Client agrees to pay ${total} per month, invoiced monthly, with payment due within 15 days of each invoice (net 15).`;
    case 'hourly':
      return `Work is billed at an hourly rate as specified. Invoices are issued bi-weekly with payment due within 10 days.`;
    case 'retainer':
      return `A monthly retainer of ${total} covers agreed scope. Additional work beyond scope is billed separately at the hourly rate.`;
    case 'custom':
      return customSplit || `Payment schedule: ${total} as agreed between both Parties in writing.`;
    default:
      return `Total fee of ${total} is due as agreed between both parties.`;
  }
}

function revisionText(code, hourlyRate) {
  switch (code) {
    case '1': return 'This fee includes one (1) round of revisions on deliverables.';
    case '2': return 'This fee includes up to two (2) rounds of revisions on deliverables.';
    case '3': return 'This fee includes up to three (3) rounds of revisions on deliverables.';
    case 'unlimited':
      return 'This fee includes unlimited revisions within the agreed scope during the project period.';
    case 'hourly_after':
      return `Includes two (2) revision rounds. Additional revisions are billed at ${hourlyRate || '$75'}/hour.`;
    default: return 'Revisions beyond agreed rounds may be billed separately.';
  }
}

function ipText(code) {
  switch (code) {
    case 'full_transfer':
      return 'Upon full and final payment, all rights, title, and interest in the final deliverables transfer to the Client. The Freelancer retains portfolio rights unless the Client requests otherwise in writing.';
    case 'license':
      return 'The Freelancer retains ownership of all work. Upon payment, the Client receives a perpetual, non-exclusive license to use the deliverables for the agreed purpose.';
    case 'shared':
      return 'Both Parties share ownership. The Client may use deliverables commercially; the Freelancer may use them in portfolio and derivative works with Client approval.';
    case 'work_for_hire':
      return 'All work product is considered "work made for hire." Upon payment, the Client owns all rights with no portfolio use by the Freelancer unless agreed in writing.';
    default:
      return 'Intellectual property terms as agreed between the Parties.';
  }
}

function confidentialityText(level) {
  switch (level) {
    case 'standard':
      return 'Both Parties agree to keep confidential any non-public business, technical, or personal information shared during this engagement.';
    case 'nda':
      return 'Both Parties agree to strict confidentiality. Neither Party shall disclose project details, source materials, or deliverables to third parties without prior written consent. This obligation survives termination for 2 years.';
    case 'minimal':
      return 'Each Party may reference the engagement in general terms (e.g., client lists, case studies) unless specific materials are marked confidential.';
    default: return 'Standard confidentiality applies.';
  }
}

function terminationText(days) {
  const d = days || '7';
  return `Either Party may terminate this Agreement with ${d} days' written notice. Upon termination, the Client pays for all work completed to date.`;
}

function lateFeeText(code) {
  switch (code) {
    case '5': return 'Late payments beyond 15 days may incur a 5% late fee.';
    case '10': return 'Late payments beyond 15 days may incur a 10% late fee.';
    case '1.5_monthly': return 'Late payments accrue interest at 1.5% per month.';
    case 'pause_work': return 'Late payments beyond 15 days may result in pausing work until payment is received.';
    case 'none': return 'No late fees apply, though work may pause if payment is significantly overdue.';
    default: return 'Late payment terms as agreed.';
  }
}

function scopeChangeText(code) {
  switch (code) {
    case 'written_change_order':
      return 'Any change to scope, timeline, or deliverables requires a written change order signed by both Parties, with adjusted fees and timeline.';
    case 'hourly_extra':
      return 'Scope changes are handled as additional work billed at the agreed hourly rate, with Client approval before proceeding.';
    case 'fixed_adjustment':
      return 'Scope changes will be quoted as a fixed additional fee before work begins on the changed scope.';
    default: return 'Scope changes require mutual written agreement.';
  }
}

function warrantyText(code) {
  switch (code) {
    case '30': return 'The Freelancer warrants deliverables against material defects for 30 days after delivery.';
    case '90': return 'The Freelancer warrants deliverables against material defects for 90 days after delivery.';
    case 'none': return 'Deliverables are provided as-is upon acceptance. No warranty beyond industry standard applies.';
    default: return 'Standard warranty applies for agreed period.';
  }
}

function communicationText(code) {
  switch (code) {
    case 'email': return 'Primary communication via email with a response within 2 business days.';
    case 'slack': return 'Primary communication via Slack or agreed messaging platform with response within 1 business day.';
    case 'weekly_call': return 'Weekly sync call plus async communication via email. Response within 2 business days.';
    default: return 'Communication via agreed channels.';
  }
}

function buildContract(d) {
  const total = fmtMoney(d.amount, d.currency);
  const rushNote = d.rushFee === 'yes'
    ? ` A rush fee of ${d.rushPercent || '25'}% applies due to expedited timeline.`
    : '';

  return {
    title: 'Freelance Services Agreement',
    blocks: [
      { heading: null, body:
        `This Freelance Services Agreement ("Agreement") is entered into on ${d.startDate || '[Start Date]'} between:\n\n` +
        `${d.freelancerName} ("Freelancer")${d.freelancerEmail ? ', ' + d.freelancerEmail : ''}\n\n` +
        `and\n\n` +
        `${d.clientName} ("Client")${d.clientEmail ? ', ' + d.clientEmail : ''}\n\n` +
        `together referred to as the "Parties."` },

      { heading: '1. Scope of Work', body:
        d.scope || `The Freelancer will provide services for "${d.projectName}" as agreed with the Client.` +
        `\n\n${scopeChangeText(d.scopeChangePolicy)}` },

      { heading: '2. Project Timeline', body:
        `Work commences on ${d.startDate || '[Start Date]'}` +
        (d.endDate ? ` and is expected to complete by ${d.endDate}.` : '.') +
        rushNote +
        ` Timelines may be adjusted by mutual written agreement.` },

      { heading: '3. Fees & Payment', body:
        `Total project fee: ${total}.\n${paymentTermsText(d.paymentTerms, d.amount, d.currency, d.customPaymentTerms)}` +
        `\n\n${lateFeeText(d.lateFeePolicy)}` },

      { heading: '4. Revisions', body: revisionText(d.revisionPolicy, d.hourlyRate) },

      { heading: '5. Ownership & Intellectual Property', body: ipText(d.ipOwnership) },

      { heading: '6. Confidentiality', body: confidentialityText(d.confidentiality) },

      { heading: '7. Communication', body: communicationText(d.communication) },

      { heading: '8. Termination', body: terminationText(d.terminationNotice) },

      { heading: '9. Warranty', body: warrantyText(d.warranty) },

      { heading: '10. Limitation of Liability', body:
        `The Freelancer's total liability shall not exceed fees paid by the Client. The Freelancer is not liable for indirect or consequential damages.` },

      { heading: '11. Additional Notes', body: d.notes || 'None.' },

      { heading: null, body:
        `By signing below (or electronic acceptance), both Parties agree to these terms.\n\n` +
        `Freelancer: ${d.freelancerName}          Date: __________\n\n` +
        `Client: ${d.clientName}          Date: __________` }
    ]
  };
}

function buildInvoice(d) {
  const total = fmtMoney(d.amount, d.currency);
  const invNum = 'INV-' + (d.startDate || '').replace(/-/g, '').slice(2) + '-' + Math.floor(Math.random() * 900 + 100);
  return {
    title: 'Invoice',
    blocks: [
      { heading: null, body:
        `Invoice #: ${invNum}\nDate: ${d.startDate || '[Date]'}\n${d.endDate ? 'Due: ' + d.endDate + '\n' : ''}` +
        `From: ${d.freelancerName}${d.freelancerEmail ? ' (' + d.freelancerEmail + ')' : ''}\n` +
        `To: ${d.clientName}${d.clientEmail ? ' (' + d.clientEmail + ')' : ''}` },
      { heading: 'Description', body: `${d.projectName}\n${d.scope || ''}` },
      { heading: 'Payment Terms', body: paymentTermsText(d.paymentTerms, d.amount, d.currency, d.customPaymentTerms) },
      { heading: 'Amount Due', body: total },
      { heading: 'Notes', body: d.notes || 'Thank you for your business!' }
    ]
  };
}

function buildProposal(d) {
  const total = fmtMoney(d.amount, d.currency);
  return {
    title: 'Project Proposal',
    blocks: [
      { heading: null, body:
        `Prepared for: ${d.clientName}\nBy: ${d.freelancerName}${d.freelancerEmail ? ' (' + d.freelancerEmail + ')' : ''}\nDate: ${d.startDate || '[Date]'}` },
      { heading: 'Overview', body: `Proposal for "${d.projectName}" — scope, timeline, and investment.` },
      { heading: 'Scope', body: d.scope || 'Defined during discovery.' },
      { heading: 'Timeline', body:
        `Start: ${d.startDate || '[Start]'}` + (d.endDate ? `\nCompletion: ${d.endDate}` : '') +
        (d.rushFee === 'yes' ? `\nExpedited delivery available.` : '') },
      { heading: 'Investment', body:
        `Total: ${total}\n${paymentTermsText(d.paymentTerms, d.amount, d.currency, d.customPaymentTerms)}\n\n` +
        revisionText(d.revisionPolicy, d.hourlyRate) },
      { heading: 'Terms', body:
        `${ipText(d.ipOwnership)}\n\n${confidentialityText(d.confidentiality)}` },
      { heading: 'Next Steps', body:
        'Reply to confirm and we will send the formal agreement and first invoice.' },
      { heading: 'Notes', body: d.notes || 'None.' }
    ]
  };
}

const TEMPLATE_BUILDERS = {
  contract: buildContract,
  invoice: buildInvoice,
  proposal: buildProposal
};
