(function () {
  const state = { activeTpl: 'contract', hasAccess: false, user: null };

  const tabs = document.querySelectorAll('.tab');
  const form = document.getElementById('doc-form');
  const statusBar = document.getElementById('status-bar');
  const customPaymentWrap = document.getElementById('customPaymentWrap');
  const customPaymentInput = document.querySelector('[name="customPaymentTerms"]');
  const paymentSelect = document.querySelector('[name="paymentTerms"]');
  const hourlyWrap = document.getElementById('hourlyRateWrap');

  async function init() {
    state.user = await window.novoAuth.requireAuth();
    if (!state.user) return;

    try {
      await window.novoApi.checkGenerateAccess();
      state.hasAccess = true;
      showStatus('Subscription active - watermark-free PDFs', 'ok');
    } catch (err) {
      state.hasAccess = false;
      if (err.status === 402) {
        showStatus('Subscribe to generate watermark-free documents', 'warn');
      } else {
        showStatus('Preview mode - subscribe for full access', 'warn');
      }
    }
  }

  function showStatus(msg, type) {
    if (!statusBar) return;
    statusBar.innerHTML = `<span class="status-${type}">${msg}</span>` +
      (state.hasAccess ? '' : ' <a href="profile.html#subscribe">View plans -></a>');
  }

  paymentSelect?.addEventListener('change', () => {
    const isCustom = paymentSelect.value === 'custom';
    if (customPaymentWrap) customPaymentWrap.style.display = isCustom ? '' : 'none';
  });

  document.querySelector('[name="revisionPolicy"]')?.addEventListener('change', (e) => {
    if (hourlyWrap) hourlyWrap.style.display = e.target.value === 'hourly_after' ? '' : 'none';
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeTpl = tab.dataset.tpl;
    });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!state.hasAccess && state.user?.role !== 'admin') {
      if (!confirm('You need an active subscription for watermark-free PDFs. Generate a watermarked preview anyway?')) {
        window.location.href = 'profile.html#subscribe';
        return;
      }
    }

    const fd = new FormData(form);
    const d = Object.fromEntries(fd.entries());
    if (!d.freelancerName || !d.clientName || !d.projectName || !d.amount) {
      alert('Please fill in all required fields.');
      return;
    }

    const builder = TEMPLATE_BUILDERS[state.activeTpl];
    const doc = builder(d);
    renderPdf(doc, state.hasAccess || state.user?.role === 'admin');
  });

  function renderPdf(doc, noWatermark) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 56;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    function addWatermark() {
      pdf.saveGraphicsState();
      pdf.setTextColor(235, 232, 226);
      pdf.setFontSize(52);
      pdf.text('novo - preview', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 35 });
      pdf.restoreGraphicsState();
    }

    function ensureSpace(lines) {
      if (y + lines * 14 > pageHeight - margin) {
        if (!noWatermark) addWatermark();
        pdf.addPage();
        y = margin;
      }
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(44, 42, 39);
    pdf.text(doc.title, margin, y);
    y += 30;

    doc.blocks.forEach(block => {
      if (block.heading) {
        ensureSpace(3);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12.5);
        pdf.text(block.heading, margin, y);
        y += 18;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(60, 58, 55);
      const lines = pdf.splitTextToSize(block.body, maxWidth);
      lines.forEach(line => {
        ensureSpace(1);
        pdf.text(line, margin, y);
        y += 14;
      });
      y += 14;
    });

    if (!noWatermark) addWatermark();
    pdf.save(`${doc.title.replace(/\s+/g, '_')}.pdf`);
  }

  init();
})();
