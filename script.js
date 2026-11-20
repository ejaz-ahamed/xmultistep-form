(() => {
  const PLANS = {
    arcade: { name: "Arcade", monthly: 9, yearly: 90 },
    advanced: { name: "Advanced", monthly: 12, yearly: 120 },
    pro: { name: "Pro", monthly: 15, yearly: 150 },
  };

  const ADDONS = {
    online: { name: "Online Services", monthly: 1, yearly: 10 },
    storage: { name: "Larger Storage", monthly: 2, yearly: 20 },
    profile: { name: "Customizable Profile", monthly: 2, yearly: 20 },
  };

  const LAST_STEP = 4;
  const THANK_YOU_STEP = 5;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_PATTERN = /^\+?[0-9\s()-]{7,20}$/;

  const form = document.getElementById("multistep-form");
  const steps = form.querySelectorAll(".step");
  const navItems = document.querySelectorAll(".steps-nav__item");
  const formNav = form.querySelector(".form__nav");
  const nextButton = document.getElementById("next-button");
  const backButton = document.getElementById("back-button");
  const personalInputs = form.querySelectorAll('.step[data-step="1"] input');
  const planCards = form.querySelectorAll(".plan_card");
  const planError = document.getElementById("plan-error");
  const billingSwitch = document.getElementById("billing-switch");
  const billingLabels = form.querySelectorAll(".billing-toggle__label");
  const addonInputs = form.querySelectorAll('.addon_card input[type="checkbox"]');

  const state = { step: 1, yearly: false, plan: null };

  const formatPrice = (amount, yearly, sign = "") => `${sign}$${amount}/${yearly ? "yr" : "mo"}`;

  /* ---------- Step 1: personal info validation ---------- */

  function getFieldError(input) {
    const value = input.value.trim();
    if (!value) return input.dataset.error;
    if (input.name === "email" && !EMAIL_PATTERN.test(value)) return "Enter a valid email";
    if (input.name === "phone" && !PHONE_PATTERN.test(value)) return "Enter a valid mobile number";
    return "";
  }

  function validateField(input) {
    const message = getFieldError(input);
    input.setCustomValidity(message);
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", String(Boolean(message)));
    document.getElementById(`${input.id}-error`).textContent = message;
    return !message;
  }

  personalInputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) validateField(input);
    });
  });

  /* ---------- Step 2: plan and billing ---------- */

  function selectPlan(card) {
    state.plan = card.dataset.plan;
    planCards.forEach((planCard) => {
      const isSelected = planCard === card;
      planCard.classList.toggle("selected", isSelected);
      planCard.setAttribute("aria-checked", String(isSelected));
    });
    planError.textContent = "";
  }

  function setBilling(yearly) {
    state.yearly = yearly;
    billingSwitch.setAttribute("aria-checked", String(yearly));
    form.classList.toggle("is-yearly", yearly);
    billingLabels.forEach((label) => {
      label.classList.toggle("is-active", (label.dataset.period === "yearly") === yearly);
    });
    planCards.forEach((card) => {
      const plan = PLANS[card.dataset.plan];
      card.querySelector(".plan_card__price").textContent = formatPrice(yearly ? plan.yearly : plan.monthly, yearly);
    });
    addonInputs.forEach((input) => {
      const addon = ADDONS[input.value];
      input.closest(".addon_card").querySelector(".addon_card__price").textContent = formatPrice(
        yearly ? addon.yearly : addon.monthly,
        yearly,
        "+"
      );
    });
  }

  planCards.forEach((card) => card.addEventListener("click", () => selectPlan(card)));
  billingSwitch.addEventListener("click", () => setBilling(!state.yearly));
  billingLabels.forEach((label) => {
    label.addEventListener("click", () => setBilling(label.dataset.period === "yearly"));
  });

  /* ---------- Step 3: add-ons ---------- */

  addonInputs.forEach((input) => {
    input.addEventListener("change", () => {
      input.closest(".addon_card").classList.toggle("is-checked", input.checked);
    });
  });

  /* ---------- Step 4: summary ---------- */

  function renderSummary() {
    const plan = PLANS[state.plan];
    const period = state.yearly ? "yearly" : "monthly";
    let total = plan[period];

    document.getElementById("summary-plan-name").textContent = `${plan.name} (${state.yearly ? "Yearly" : "Monthly"})`;
    document.getElementById("summary-plan-price").textContent = formatPrice(plan[period], state.yearly);

    const list = document.getElementById("summary-addons");
    list.replaceChildren();
    addonInputs.forEach((input) => {
      if (!input.checked) return;
      const addon = ADDONS[input.value];
      total += addon[period];

      const item = document.createElement("li");
      const name = document.createElement("span");
      const price = document.createElement("span");
      name.textContent = addon.name;
      price.className = "summary__addon-price";
      price.textContent = formatPrice(addon[period], state.yearly, "+");
      item.append(name, price);
      list.append(item);
    });
    list.hidden = list.children.length === 0;

    document.getElementById("summary-total-label").textContent = `Total (per ${state.yearly ? "year" : "month"})`;
    document.getElementById("summary-total-price").textContent = formatPrice(total, state.yearly, "+");
  }

  /* ---------- Navigation ---------- */

  function validateStep(step) {
    if (step === 1) {
      let firstInvalid = null;
      personalInputs.forEach((input) => {
        if (!validateField(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return false;
      }
    }

    if (step === 2 && !state.plan) {
      planError.textContent = "Please select a plan";
      return false;
    }

    return true;
  }

  function showStep(step) {
    state.step = step;

    steps.forEach((section) => {
      section.hidden = Number(section.dataset.step) !== step;
    });

    const activeNavStep = Math.min(step, LAST_STEP);
    navItems.forEach((item) => {
      const isActive = Number(item.dataset.step) === activeNavStep;
      item.classList.toggle("is-active", isActive);
      if (isActive) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });

    backButton.hidden = step === 1;
    formNav.hidden = step === THANK_YOU_STEP;
    nextButton.textContent = step === LAST_STEP ? "Confirm" : "Next step";
    nextButton.classList.toggle("btn--confirm", step === LAST_STEP);

    if (step === LAST_STEP) renderSummary();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateStep(state.step)) return;
    showStep(state.step === LAST_STEP ? THANK_YOU_STEP : state.step + 1);
  });

  backButton.addEventListener("click", () => showStep(state.step - 1));
  document.getElementById("change-plan").addEventListener("click", () => showStep(2));

  showStep(1);
})();
