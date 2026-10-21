/**
 * سلطانة (SULTANA) - INTERACTION CONTROLLER
 * Full client-side state management for booking, waitlist, tracking, chat & cart.
 */

// Global State
const sultanaState = {
  booking: {
    service: 'ميك أب',
    servicePrice: 850,
    day: 'الاثنين 12',
    time: '5:00 م',
    expert: 'ريم',
    payment: 'فوري'
  },
  selectedGiftDenom: 500,
  cart: [],
  trackingStep: 3
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateBookingSummary();
  updateCartBadge();
});

/* ==========================================================================
   1. BOOKING WIDGET LOGIC
   ========================================================================== */
function selectBookingOption(type, value, price, buttonElement) {
  // Update state
  sultanaState.booking[type] = value;
  if (price !== null && price !== undefined) {
    sultanaState.booking.servicePrice = price;
  }

  // Update active pill UI in the same group
  const parentGroup = buttonElement.parentElement;
  const siblings = parentGroup.querySelectorAll('.booking-pill-btn');
  siblings.forEach(btn => btn.classList.remove('active'));
  buttonElement.classList.add('active');

  // Update Live Summary Text
  updateBookingSummary();
}

function updateBookingSummary() {
  const b = sultanaState.booking;
  const summaryText = `${b.service} مع ${b.expert} · ${b.day} · ${b.time} · ${b.servicePrice} ج.م`;
  const summaryEl = document.getElementById('bookingSummaryText');
  if (summaryEl) {
    summaryEl.textContent = summaryText;
  }
}

function confirmBookingAction() {
  const b = sultanaState.booking;
  const receiptEl = document.getElementById('modalReceiptDetails');
  if (receiptEl) {
    receiptEl.innerHTML = `
      <strong>تفاصيل الحجز:</strong><br>
      • الخدمة: ${b.service}<br>
      • الخبيرة: ${b.expert}<br>
      • الميعاد: ${b.day} الساعة ${b.time}<br>
      • طريقة الدفع: ${b.payment}<br>
      • إجمالي المبلغ: <strong>${b.servicePrice} ج.م</strong><br>
      • كود الحجز: <span style="color:var(--burgundy); font-weight:800;">#SLT-${Math.floor(100000 + Math.random() * 900000)}</span>
    `;
  }
  openModal('bookingModal');
}

function quickSelectSalon(salonName, preferredService) {
  // Set preferred service
  const servicePill = Array.from(document.querySelectorAll('#serviceGroup .booking-pill-btn'))
    .find(btn => btn.textContent.trim().includes(preferredService));
  
  if (servicePill) {
    servicePill.click();
  }

  // Scroll down to booking widget
  scrollToSection('bookingSection');
  showToast(`تم اختيار ${salonName} لخدمة ${preferredService}`);
}

/* ==========================================================================
   2. WAITLIST HANDLER
   ========================================================================== */
function handleWaitlistSubmit(event) {
  event.preventDefault();
  const phoneInput = document.getElementById('phoneInput');
  const phoneVal = phoneInput.value.trim();

  if (!phoneVal || phoneVal.length < 11) {
    showToast('يرجى إدخال رقم جوال صحيح مكون من 11 رقم');
    return;
  }

  // Save to localStorage
  try {
    const list = JSON.parse(localStorage.getItem('sultana_waitlist') || '[]');
    list.push({ phone: phoneVal, date: new Date().toISOString() });
    localStorage.setItem('sultana_waitlist', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }

  // Open VIP modal
  const successMsg = document.getElementById('waitlistSuccessMsg');
  if (successMsg) {
    successMsg.textContent = `تم تسجيل رقمك (${phoneVal}) بنجاح! أنتِ الآن ضمن أول 1000 سلطانة وتم تفعيل هديتكِ الحصرية.`;
  }
  openModal('waitlistModal');
  phoneInput.value = '';
}

/* ==========================================================================
   3. SALON FILTERING
   ========================================================================== */
function filterSalons(category, btnElement) {
  // Update button active state
  const tabs = document.querySelectorAll('.filter-tab-btn');
  tabs.forEach(t => t.classList.remove('active'));
  btnElement.classList.add('active');

  // Filter cards
  const cards = document.querySelectorAll('.salon-card-item');
  cards.forEach(card => {
    if (category === 'all') {
      card.style.display = 'flex';
    } else {
      const cardCats = card.getAttribute('data-category') || '';
      if (cardCats.includes(category)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    }
  });
}

/* ==========================================================================
   4. STORE & CART SYSTEM
   ========================================================================== */
function addToCart(title, price) {
  sultanaState.cart.push({ title, price });
  updateCartBadge();
  showToast(`تمت إضافة "${title}" إلى السلة 🛍️`);
}

function updateCartBadge() {
  const badge = document.getElementById('cartCounter');
  if (badge) {
    badge.textContent = sultanaState.cart.length;
    badge.style.display = sultanaState.cart.length > 0 ? 'flex' : 'none';
  }
}

document.getElementById('openCartBtn')?.addEventListener('click', () => {
  const listEl = document.getElementById('cartItemsList');
  const totalEl = document.getElementById('cartTotalPrice');

  if (sultanaState.cart.length === 0) {
    listEl.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">السلة فارغة حاليًا. تصفحي المنتجات وأضيفي ما يعجبك!</p>';
    totalEl.textContent = '0 ج.م';
  } else {
    let sum = 0;
    listEl.innerHTML = sultanaState.cart.map((item, index) => {
      sum += item.price;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
          <div>
            <strong>${item.title}</strong><br>
            <span style="color:var(--burgundy); font-weight:700;">${item.price} ج.م</span>
          </div>
          <button onclick="removeFromCart(${index})" style="background:transparent; border:none; color:red; cursor:pointer; font-size:1.1rem;" title="حذف">&times;</button>
        </div>
      `;
    }).join('');
    totalEl.textContent = `${sum} ج.م`;
  }

  openModal('cartModal');
});

function removeFromCart(index) {
  sultanaState.cart.splice(index, 1);
  updateCartBadge();
  document.getElementById('openCartBtn').click();
}

function checkoutCart() {
  if (sultanaState.cart.length === 0) {
    showToast('السلة فارغة!');
    return;
  }
  closeModal('cartModal');
  showToast('تم استقبال طلبك بنجاح! سيتواصل معكِ مندوب التوصيل.');
  sultanaState.cart = [];
  updateCartBadge();
}

/* ==========================================================================
   5. GIFT CARD INTERACTION
   ========================================================================== */
function selectGiftDenom(amount, chipElement) {
  sultanaState.selectedGiftDenom = amount;
  const chips = document.querySelectorAll('#giftDenomGroup .gift-denom-chip');
  chips.forEach(c => c.classList.remove('active'));
  chipElement.classList.add('active');
}

function buyGiftCard() {
  addToCart(`كارت هدية سلطانة بقيمة ${sultanaState.selectedGiftDenom} ج.م`, sultanaState.selectedGiftDenom);
}

/* ==========================================================================
   6. DRESS & VENUE MODALS
   ========================================================================== */
function openDressModal(title, price) {
  const receiptEl = document.getElementById('modalReceiptDetails');
  receiptEl.innerHTML = `
    <strong>طلب استشارة / تجربة:</strong><br>
    • القطعة: ${title}<br>
    • السعر: ${price}<br>
    • خدمة القياس: متوفرة في الأتيليه أو تجربة منزلية VIP.<br>
    • التواصل: مصممة الأزياء جاهزة للتنسيق معكِ الآن.
  `;
  openModal('bookingModal');
}

function openVenueModal(title, details) {
  const receiptEl = document.getElementById('modalReceiptDetails');
  receiptEl.innerHTML = `
    <strong>حجز موعد معاينة:</strong><br>
    • المكان: ${title}<br>
    • المواصفات: ${details}<br>
    • يتضمن الحجز: منسق مناسبات خاص، قائمة أسعار الباقات وعروض التواريخ الخاصة.
  `;
  openModal('bookingModal');
}

/* ==========================================================================
   7. TRACKING STEPPER & ACTIONS
   ========================================================================== */
function setTrackingStep(stepNum) {
  sultanaState.trackingStep = stepNum;
  const steps = document.querySelectorAll('.stepper-step');
  steps.forEach((step, idx) => {
    const currentStepIndex = idx + 1;
    step.classList.remove('completed', 'active');
    if (currentStepIndex < stepNum) {
      step.classList.add('completed');
    } else if (currentStepIndex === stepNum) {
      step.classList.add('active');
    }
  });
}

function rescheduleOrder() {
  scrollToSection('bookingSection');
  showToast('تم فتح قسم المواعيد، يرجى اختيار التوقيت الجديد لتعديل الحجز.');
}

function cancelOrder() {
  if (confirm('هل أنتِ متأكدة من رغبتكِ في إلغاء الطلب؟ الإلغاء مجاني قبل الميعاد بـ 24 ساعة.')) {
    setTrackingStep(5);
    showToast('تم إلغاء الطلب بدون أي رسوم.');
  }
}

/* ==========================================================================
   8. LIVE CHAT SIMULATOR
   ========================================================================== */
function handleChatSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  appendChatMessage(msg, 'user');
  input.value = '';

  // Simulated Expert Reply after 1 second
  setTimeout(() => {
    const replies = [
      'تمام تسلمي، أنا على بُعد 10 دقائق بالضبط من موقعك.',
      'وصلت عند مدخل العمارة يا فندم، طالعة لحضرتك حالاً.',
      'شكراً ليكي، الأدوات معقمة وجاهزة وكل شيء تمام.',
      'أكيد، تحت أمرك في أي تعديل على التسريحة أو الميك أب!'
    ];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    appendChatMessage(randomReply, 'expert');
  }, 1000);
}

function sendQuickChatMessage(text) {
  appendChatMessage(text, 'user');
  setTimeout(() => {
    appendChatMessage('تم الاستلام، شكرًا لمشاركتك!', 'expert');
  }, 900);
}

function appendChatMessage(text, sender) {
  const chatBody = document.getElementById('chatMessages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  chatBody.appendChild(bubble);
  chatBody.scrollTop = chatBody.scrollHeight;
}

/* ==========================================================================
   9. FAQ ACCORDION
   ========================================================================== */
function toggleFaq(cardElement) {
  const answer = cardElement.querySelector('.faq-answer-text');
  const arrow = cardElement.querySelector('.faq-question-title span:last-child');
  
  if (answer.style.display === 'none') {
    answer.style.display = 'block';
    arrow.textContent = '▾';
  } else {
    answer.style.display = 'none';
    arrow.textContent = '▸';
  }
}

/* ==========================================================================
   10. PARTNER REGISTRATION MODAL
   ========================================================================== */
function openPartnerModal() {
  openModal('partnerModal');
}

function handlePartnerSubmit(event) {
  event.preventDefault();
  closeModal('partnerModal');
  showToast('تم استلام طلب انضمامك كشريكة بنجاح! سيتواصل معكِ فريق شراكات سلطانة.');
}

/* ==========================================================================
   11. UTILITY FUNCTIONS (Modals, Toasts, Coupons, Scroll)
   ========================================================================== */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
  }
}

// Close modal when clicking outside dialog
document.querySelectorAll('.modal-backdrop').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
});

function copyCouponCode(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`تم نسخ الكود: ${code}`);
    }).catch(() => {
      showToast(`الكود هو: ${code}`);
    });
  } else {
    showToast(`الكود هو: ${code}`);
  }
}

function showToast(message) {
  const toast = document.getElementById('toastNotice');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
