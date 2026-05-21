// Contact form and WhatsApp helpers for the Sunam Alert site.

const WHATSAPP_NUMBER = '919216813000';
const CONTACT_EMAIL = 'thesunamalert@gmail.com';

// Send a WhatsApp message using the configured phone number.
function sendWhatsApp(customMsg) {
  const msg = customMsg
    || document.getElementById('wa-message')?.value
    || 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ SUNAM ALERT ਨਾਲ ਸੰਪਰਕ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ।';
  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
}

// Submit the contact form to the backend or fallback to email if needed.
let isSubmitting = false;
async function handleContactForm(e) {
  e.preventDefault();
  if (isSubmitting) return;

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn ? btn.textContent : '';

  const name = document.getElementById('contact-name')?.value?.trim();
  const email = document.getElementById('contact-email')?.value?.trim();
  const subject = document.getElementById('contact-subject')?.value;
  const message = document.getElementById('contact-message')?.value?.trim();

  if (!name || !email || !message) {
    showToast('ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਖੇਤਰ ਭਰੋ।', 'error');
    return;
  }

  isSubmitting = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'ਭੇਜਿਆ ਜਾ ਰਿਹਾ ਹੈ...';
  }

  const payload = { name, email, subject, message };
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Contact request failed');

    showToast('ਤੁਹਾਡਾ ਸੁਨੇਹਾ ਸਫਲਤਾਪੂਰਵਕ ਭੇਜਿਆ ਗਿਆ!', 'success');
    e.target.reset();
  } catch (err) {
    // Fallback to mailto if backend is unavailable
    const mailSubject = encodeURIComponent(subject || 'SUNAM ALERT ਤੋਂ ਸੁਨੇਹਾ');
    const mailBody = encodeURIComponent(
      `ਨਾਮ: ${name}\nਈਮੇਲ: ${email}\n\nਸੁਨੇਹਾ:\n${message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

    showToast('ਸੁਰੱਖਿਅਤ fallback ਨਾਲ ਸੁਨੇਹਾ ਭੇਜਿਆ ਜਾ ਰਿਹਾ ਹੈ...', 'success');
    e.target.reset();
  } finally {
    isSubmitting = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

// Send a prefilled news tip message to WhatsApp.
function sendNewsTip() {
  const msg = 'ਮੈਂ SUNAM ALERT ਨੂੰ ਇੱਕ ਖ਼ਬਰ ਦੀ ਜਾਣਕਾਰੀ ਦੇਣਾ ਚਾਹੁੰਦਾ ਹਾਂ:';
  sendWhatsApp(msg);
}

document.addEventListener('DOMContentLoaded', function () {
  // Contact form
  const form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', handleContactForm);

  // Attach the WhatsApp button click handler.
  const waBtn = document.getElementById('wa-btn');
  if (waBtn) waBtn.addEventListener('click', () => sendWhatsApp());

  // Attach quick news-tip buttons to WhatsApp.
  document.querySelectorAll('.btn-news-tip').forEach(btn => {
    btn.addEventListener('click', sendNewsTip);
  });

  // Attach the WhatsApp community join button.
  const joinBtn = document.getElementById('join-community-btn');
  if (joinBtn) joinBtn.addEventListener('click', () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('ਮੈਂ SUNAM ALERT WhatsApp ਕਮਿਊਨਿਟੀ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਣਾ ਚਾਹੁੰਦਾ ਹਾਂ।')}`, '_blank');
  });
});

