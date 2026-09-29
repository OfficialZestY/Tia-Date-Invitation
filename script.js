// ===== STATE =====
const state = {
  selectedDate: null, // Date object
  selectedTime: null, // "HH:MM"
  movie: "",
  note: "",
};

// ===== ELEMENTS =====
const landing = document.getElementById("landing");
const planner = document.getElementById("planner");
const review = document.getElementById("review");
const confirmed = document.getElementById("confirmed");

const startBtn = document.getElementById("startBtn");
const reviewBtn = document.getElementById("reviewBtn");
const confirmBtn = document.getElementById("confirmBtn");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const currentMonthLabel = document.getElementById("currentMonthLabel");
const calendarDays = document.getElementById("calendarDays");

const timeInput = document.getElementById("timeInput");
const movieInput = document.getElementById("movieInput");
const noteInput = document.getElementById("noteInput");

const summaryDate = document.getElementById("summaryDate");
const summaryTime = document.getElementById("summaryTime");
const summaryMovie = document.getElementById("summaryMovie");
const summaryNoteRow = document.getElementById("summaryNoteRow");
const summaryNote = document.getElementById("summaryNote");

const formDate = document.getElementById("formDate");
const formTime = document.getElementById("formTime");
const formMovie = document.getElementById("formMovie");
const formNote = document.getElementById("formNote");
const formTimestamp = document.getElementById("formTimestamp");

const dateForm = document.getElementById("dateForm");
const countdown = document.getElementById("countdown");
const countdownWrapper = document.getElementById("countdownWrapper");

// ===== NAVIGATION =====
startBtn.addEventListener("click", () => {
  landing.classList.add("hidden");
  planner.classList.remove("hidden");
  planner.classList.add("fade-in");
  initCalendar();
});

reviewBtn.addEventListener("click", () => {
  // Validate
  if (!state.selectedDate) {
    alert("Please pick a date for our date. 🗓️");
    return;
  }
  if (!timeInput.value) {
    alert("Don’t forget to pick a time. 🕐");
    return;
  }
  if (!movieInput.value.trim()) {
    alert("Which movie are we watching? 🎬");
    return;
  }

  state.selectedTime = timeInput.value;
  state.movie = movieInput.value.trim();
  state.note = noteInput.value.trim();

  // Fill summary
  const dateStr = state.selectedDate.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  summaryDate.textContent = dateStr;
  summaryTime.textContent = state.selectedTime;
  summaryMovie.textContent = state.movie;

  if (state.note) {
    summaryNoteRow.style.display = "grid";
    summaryNote.textContent = state.note;
  } else {
    summaryNoteRow.style.display = "none";
  }

  planner.classList.add("hidden");
  review.classList.remove("hidden");
  review.classList.add("fade-in");
});

// Form submission handled by Formspree; we just fill hidden fields
dateForm.addEventListener("submit", (e) => {
  if (!state.selectedDate || !state.selectedTime || !state.movie) {
    e.preventDefault();
    alert("Something’s missing… let’s fix it and try again.");
    return;
  }

  const dateStr = state.selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  formDate.value = dateStr;
  formTime.value = state.selectedTime;
  formMovie.value = state.movie;
  formNote.value = state.note || "(no message)";
  formTimestamp.value = new Date().toISOString();

  // Let Formspree handle the POST; after success, we’ll show confirmation
  // Formspree by default redirects to a "thank you" page; we’ll intercept that.
  e.preventDefault();

  const formData = new FormData(dateForm);

  fetch(dateForm.action, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  })
    .then((res) => {
      if (res.ok) {
        showConfirmed();
      } else {
        alert("Hmm, something went wrong sending your answer. Try again?");
      }
    })
    .catch(() => {
      alert("Network issue. Please try again in a moment.");
    });
});

function showConfirmed() {
  review.classList.add("hidden");
  confirmed.classList.remove("hidden");
  confirmed.classList.add("fade-in");

  // Start countdown to selected date/time
  startCountdown();
}

// ===== CALENDAR LOGIC =====
let currentMonthDate = new Date();

function initCalendar() {
  renderCalendar(currentMonthDate);
}

function renderCalendar(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-11

  const monthName = baseDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  currentMonthLabel.textContent = monthName;

  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  calendarDays.innerHTML = "";

  // Empty cells before first day
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "day-cell disabled";
    empty.textContent = "";
    calendarDays.appendChild(empty);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.textContent = d;

    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);

    // Mark today
    if (cellDate.getTime() === today.getTime()) {
      cell.classList.add("today");
    }

    // Disable past dates
    if (cellDate < today) {
      cell.classList.add("disabled");
    } else {
      cell.addEventListener("click", () => selectDate(cell, cellDate));
    }

    // Mark selected
    if (
      state.selectedDate &&
      cellDate.getTime() === state.selectedDate.getTime()
    ) {
      cell.classList.add("selected");
    }

    calendarDays.appendChild(cell);
  }
}

function selectDate(cell, dateObj) {
  // Clear previous selection
  const prev = calendarDays.querySelector(".selected");
  if (prev) prev.classList.remove("selected");

  cell.classList.add("selected");
  state.selectedDate = dateObj;
}

prevMonthBtn.addEventListener("click", () => {
  currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
  renderCalendar(currentMonthDate);
});

nextMonthBtn.addEventListener("click", () => {
  currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
  renderCalendar(currentMonthDate);
});

// ===== COUNTDOWN =====
let countdownInterval = null;

function startCountdown() {
  if (!state.selectedDate || !state.selectedTime) {
    countdownWrapper.style.display = "none";
    return;
  }

  const [hours, minutes] = state.selectedTime.split(":").map(Number);
  const target = new Date(state.selectedDate);
  target.setHours(hours, minutes, 0, 0);

  function update() {
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      countdown.textContent = "Now ♡";
      clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const pad = (n) => String(n).padStart(2, "0");
    countdown.textContent = `${pad(days)}:${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  update();
  countdownInterval = setInterval(update, 1000);
}