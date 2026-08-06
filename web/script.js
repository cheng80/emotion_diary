const galleryImages = [
  ["01-alvan-nee.png", "주황색 배경 앞에 앉아 있는 강아지"],
  ["02-ja-san-miguel.png", "잔디 위에 앉아 있는 갈색 강아지"],
  ["03-jack-brind.png", "창가에 기대어 있는 강아지"],
  ["04-erda-estremera.png", "담요 위에 누워 있는 작은 강아지"],
  ["05-curology.png", "빨간 옷을 입은 강아지"],
  ["06-ron-fung.png", "잔디 위에서 뛰어오르는 강아지"],
  ["07-nathaniel-bowman.png", "어두운 배경의 검은 강아지"],
  ["08-humberto-santos.png", "바구니 안에서 쉬고 있는 강아지"],
  ["09-joe-caione.png", "풀밭을 달리는 작은 강아지"],
  ["10-alvan-nee.png", "주황색 배경 앞에 앉아 있는 강아지"],
];

const gallery = document.querySelector("#gallery");
const isDetailPage = Boolean(document.querySelector("#detail-view"));
const diaryStorageKey = "minji-diary-entries";
const ratioSelect = document.querySelector("#ratio-select");
const moodSelect = document.querySelector("#mood-select");
const diarySearch = document.querySelector("#diary-search");
const diaryGrid = document.querySelector("#diary-grid");
const themeToggle = document.querySelector("#theme-toggle");
const scrollTop = document.querySelector("#scroll-top");
const statusMessage = document.querySelector("#status-message");
const writeDialog = document.querySelector("#write-dialog");
const cancelDialog = document.querySelector("#cancel-dialog");
const successDialog = document.querySelector("#success-dialog");
const deleteDialog = document.querySelector("#delete-dialog");
const writeForm = document.querySelector("#write-form");
const writeDialogTitle = document.querySelector("#write-dialog-title");
const submitDiaryButton = document.querySelector("#submit-diary");
const cancelDialogTitle = document.querySelector("#cancel-dialog-title");
const cancelDialogMessage = document.querySelector("#cancel-dialog-message");
const successDialogTitle = document.querySelector("#success-dialog-title");
const successDialogMessage = document.querySelector("#success-dialog-message");
const toast = document.querySelector("#toast");
const libraryView = document.querySelector("#library-view");
const detailView = document.querySelector("#detail-view");
const siteFooter = document.querySelector(".site-footer");
const detailTitle = document.querySelector("#detail-title");
const detailMoodImage = document.querySelector("#detail-mood-image");
const detailMood = document.querySelector("#detail-mood");
const detailDate = document.querySelector("#detail-date");
const detailBody = document.querySelector("#detail-body");
const reflectionInput = document.querySelector("#reflection-input");
const reflectionList = document.querySelector("#reflection-list");
const pagination = document.querySelector("#pagination");
const pageNumbers = document.querySelector("#page-numbers");
const previousPage = document.querySelector("#previous-page");
const nextPage = document.querySelector("#next-page");
const tabs = document.querySelectorAll("[data-view]");
const panels = document.querySelectorAll("[data-view-panel]");

const diarySeeds = [
  { mood: "sad", label: "슬퍼요", color: "#28b4e1", image: "diary-sad.png", title: "타이틀 영역 입니다. 한줄까지만 노출 됩니다.", content: "오늘은 조금 슬펐지만, 지나고 나면 괜찮아질 거라고 생각했다.", reflections: [] },
  { mood: "surprised", label: "놀랐어요", color: "#d59029", image: "diary-surprised.png", title: "타이틀 영역 입니다.", content: "예상하지 못했던 일이 생겨서 한참을 바라보았다.", reflections: [] },
  { mood: "angry", label: "화나요", color: "#777777", image: "diary-angry.png", title: "타이틀 영역 입니다.", content: "속상한 마음을 정리하고 다음에는 더 차분하게 이야기해 보기로 했다.", reflections: [] },
  { mood: "happy", label: "행복해요", color: "#ea5757", image: "diary-happy.png", title: "타이틀 영역 입니다.", content: "내용이 들어갑니다내용이 들어갑니다내용이 들어갑니다내용이 들어갑니다내용이 들어갑니다내용이 들어갑니다내용이 들어갑니다내용이 들어갑니다내용이 들어갑니다내용이 들어갑니다", reflections: ["3년이 지나고 다시 보니 이때가 그립다.", "다음에도 오늘처럼 웃을 일이 많았으면 좋겠다."] },
];

function createSeedEntries() {
  return Array.from({ length: 60 }, (_, index) => {
    const seed = diarySeeds[index % diarySeeds.length];
    return { ...seed, id: index + 1, date: "2024. 03. 12", reflections: [...seed.reflections] };
  });
}

function loadDiaryEntries() {
  try {
    const savedEntries = JSON.parse(localStorage.getItem(diaryStorageKey));
    if (Array.isArray(savedEntries) && savedEntries.length) {
      return savedEntries.map((entry) => ({ ...entry, reflections: Array.isArray(entry.reflections) ? entry.reflections : [] }));
    }
  } catch {
    localStorage.removeItem(diaryStorageKey);
  }
  return createSeedEntries();
}

function saveDiaryEntries() {
  localStorage.setItem(diaryStorageKey, JSON.stringify(diaryEntries));
}

let diaryEntries = loadDiaryEntries();

let activeEntry = null;
let editingEntry = null;
let pendingDeleteEntry = null;
let toastTimer = null;
let currentPage = 1;
const pageSize = 12;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function todayLabel() {
  const date = new Date();
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}`;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy failed");
}

function openWriteDialog(entry = null) {
  editingEntry = entry;
  const isEditing = Boolean(entry);
  writeDialogTitle.textContent = isEditing ? "일기 수정" : "일기 쓰기";
  submitDiaryButton.textContent = isEditing ? "수정하기" : "등록하기";
  cancelDialogTitle.textContent = isEditing ? "일기 수정 취소" : "일기 쓰기 취소";
  cancelDialogMessage.textContent = `${isEditing ? "수정" : "작성"} 중인 내용이 저장되지 않습니다. 취소하시겠습니까?`;

  writeForm.reset();
  if (entry) {
    writeForm.elements["write-mood"].value = entry.mood;
    writeForm.elements.title.value = entry.title;
    writeForm.elements.content.value = entry.content;
  }
  writeDialog.showModal();
}

function getRoute() {
  if (isDetailPage) {
    return { view: "diary", id: Number(new URLSearchParams(location.search).get("id")) || null };
  }
  const [view, id] = location.hash.slice(1).split("/");
  return { view: view === "photos" ? "photos" : "diary", id: Number(id) || null };
}

function renderRoute() {
  const { view, id } = getRoute();
  if (view === "diary" && id) {
    const entry = diaryEntries.find((item) => String(item.id) === String(id));
    if (entry) {
      if (!isDetailPage) {
        location.href = `./detail.html?id=${entry.id}`;
        return;
      }
      showDetail(entry);
      return;
    }
    if (isDetailPage) {
      location.href = "./index.html#diary";
    } else {
      location.hash = "#diary";
    }
    return;
  }

  if (isDetailPage) {
    location.href = "./index.html#diary";
    return;
  }
  activeEntry = null;
  if (detailView) detailView.hidden = true;
  libraryView.hidden = false;
  siteFooter.hidden = false;
  showView(view);
}

function renderGallery() {
  if (!gallery) return;
  gallery.className = `gallery gallery--${ratioSelect.value}`;
  gallery.innerHTML = galleryImages
    .map(
      ([file, alt], index) => `
        <figure class="gallery__item" data-node-id="3:${147 + index * 3}">
          <img src="../assets/${file}" alt="${alt}" loading="eager" />
        </figure>
      `,
    )
    .join("");
}

function renderDiary() {
  if (!diaryGrid) return;
  const mood = moodSelect.value;
  const query = diarySearch.value.trim().toLowerCase();
  const filteredEntries = diaryEntries.filter((entry) => {
    const matchesMood = mood === "all" || entry.mood === mood;
    const matchesQuery = !query || `${entry.label} ${entry.title}`.toLowerCase().includes(query);
    return matchesMood && matchesQuery;
  });
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const entries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  diaryGrid.innerHTML = entries.length
    ? entries.map((entry) => `
        <article class="diary-card" data-entry-id="${entry.id}">
        <div class="diary-card__image">
          <img src="../assets/${escapeHtml(entry.image)}" alt="${escapeHtml(entry.label)} 감정 일기 이미지" loading="eager" />
          <button class="diary-card__open" type="button">상세 보기</button>
          <button class="diary-card__delete" type="button" aria-label="${escapeHtml(entry.title)} 삭제">
            <img src="../assets/close.svg" alt="" aria-hidden="true" />
          </button>
        </div>
        <div class="diary-card__body">
          <div class="diary-card__meta">
            <span class="diary-card__mood" style="color: ${escapeHtml(entry.color)}">${escapeHtml(entry.label)}</span>
            <time class="diary-card__date">${escapeHtml(entry.date || "2024. 03. 12")}</time>
          </div>
          <p class="diary-card__title">${escapeHtml(entry.title)}</p>
        </div>
      </article>
    `).join("")
    : '<p class="empty-state">검색 결과가 없습니다.</p>';
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (!pagination) return;
  pagination.hidden = totalPages < 2;
  pageNumbers.innerHTML = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return `<button class="pagination__number${page === currentPage ? " is-active" : ""}" type="button" data-page="${page}" aria-label="${page}페이지" aria-current="${page === currentPage ? "page" : "false"}">${page}</button>`;
  }).join("");
  previousPage.disabled = currentPage === 1;
  nextPage.disabled = currentPage === totalPages;
}

function renderReflections() {
  if (!reflectionList) return;
  reflectionList.innerHTML = (activeEntry?.reflections || [])
    .map((reflection) => `
      <div class="reflection-item">
        <span>${escapeHtml(reflection)}</span>
        <time datetime="2024-09-24">[2024. 09. 24]</time>
      </div>
    `)
    .join("");
}

function showDetail(entry) {
  activeEntry = entry;
  detailTitle.textContent = entry.title;
  detailMoodImage.src = "../assets/mood-happy.png";
  detailMoodImage.alt = `${entry.label} 감정`;
  detailMood.textContent = entry.label;
  detailMood.style.color = entry.color;
  detailDate.textContent = entry.date || "2024. 07. 12";
  detailBody.textContent = entry.content;
  reflectionInput.value = "";
  renderReflections();
  if (libraryView) libraryView.hidden = true;
  detailView.hidden = false;
  if (siteFooter && !isDetailPage) siteFooter.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  statusMessage.textContent = `${entry.title} 상세 화면입니다.`;
}

function hideDetail() {
  location.href = isDetailPage ? "./index.html#diary" : "#diary";
}

function showView(view) {
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle("tab--active", isActive);
    tab.setAttribute("aria-current", isActive ? "page" : "false");
  });
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== view;
  });
  statusMessage.textContent = view === "photos" ? "사진보관함을 보고 있습니다." : "일기보관함을 보고 있습니다.";
}

function setTheme(isDark) {
  document.body.classList.toggle("is-dark", isDark);
  if (themeToggle) {
    themeToggle.checked = isDark;
    themeToggle.setAttribute("aria-checked", String(isDark));
  }
  localStorage.setItem("diary-theme", isDark ? "dark" : "light");
}

ratioSelect?.addEventListener("change", () => {
  renderGallery();
  statusMessage.textContent = `${ratioSelect.options[ratioSelect.selectedIndex].text} 사진으로 전환했습니다.`;
});

moodSelect?.addEventListener("change", () => {
  currentPage = 1;
  renderDiary();
});
diarySearch?.addEventListener("input", () => {
  currentPage = 1;
  renderDiary();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    location.hash = `#${tab.dataset.view}`;
  });
});

diaryGrid?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".diary-card__delete");
  if (deleteButton) {
    const card = deleteButton.closest(".diary-card");
    pendingDeleteEntry = diaryEntries.find((entry) => String(entry.id) === card.dataset.entryId) || null;
    if (pendingDeleteEntry) deleteDialog.showModal();
    return;
  }

  const card = event.target.closest(".diary-card");
  if (card) location.href = `./detail.html?id=${card.dataset.entryId}`;
});

pageNumbers?.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (!pageButton) return;
  currentPage = Number(pageButton.dataset.page);
  renderDiary();
  diaryGrid.scrollIntoView({ behavior: "smooth", block: "start" });
});

previousPage?.addEventListener("click", () => {
  if (currentPage === 1) return;
  currentPage -= 1;
  renderDiary();
  diaryGrid.scrollIntoView({ behavior: "smooth", block: "start" });
});

nextPage?.addEventListener("click", () => {
  const totalPages = Number(pageNumbers.lastElementChild?.dataset.page) || 1;
  if (currentPage >= totalPages) return;
  currentPage += 1;
  renderDiary();
  diaryGrid.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("#copy-detail")?.addEventListener("click", async () => {
  if (!activeEntry) return;
  try {
    await copyText(activeEntry.content);
    showToast("내용이 복사되었습니다.");
    statusMessage.textContent = "내용이 복사되었습니다.";
  } catch {
    showToast("내용 복사에 실패했습니다.");
    statusMessage.textContent = "내용 복사에 실패했습니다.";
  }
});

document.querySelector("#edit-detail")?.addEventListener("click", () => {
  if (!activeEntry) return;
  openWriteDialog(activeEntry);
});

document.querySelector("#delete-detail")?.addEventListener("click", () => {
  if (!activeEntry) return;
  pendingDeleteEntry = activeEntry;
  deleteDialog.showModal();
});

document.querySelector("#reflection-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const reflection = reflectionInput.value.trim();
  if (!activeEntry || !reflection) return;
  activeEntry.reflections.push(reflection);
  saveDiaryEntries();
  reflectionInput.value = "";
  renderReflections();
  statusMessage.textContent = "회고를 등록했습니다.";
});

document.querySelector("#write-button")?.addEventListener("click", () => {
  openWriteDialog();
});

document.querySelector("#close-dialog")?.addEventListener("click", () => {
  writeDialog.close();
  cancelDialog.showModal();
});

writeDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  writeDialog.close();
  cancelDialog.showModal();
});

document.querySelector("#keep-writing")?.addEventListener("click", () => {
  cancelDialog.close();
  writeDialog.showModal();
});

document.querySelector("#discard-writing")?.addEventListener("click", () => {
  cancelDialog.close();
  writeForm.reset();
  editingEntry = null;
  statusMessage.textContent = "일기 작성을 취소했습니다.";
});

cancelDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  cancelDialog.close();
  writeDialog.showModal();
});

document.querySelector("#close-success")?.addEventListener("click", () => {
  successDialog.close();
});

document.querySelector("#cancel-delete")?.addEventListener("click", () => {
  pendingDeleteEntry = null;
  deleteDialog.close();
});

document.querySelector("#confirm-delete")?.addEventListener("click", () => {
  if (!pendingDeleteEntry) return;
  const deletingDetail = activeEntry === pendingDeleteEntry;
  diaryEntries = diaryEntries.filter((entry) => entry !== pendingDeleteEntry);
  pendingDeleteEntry = null;
  saveDiaryEntries();
  renderDiary();
  deleteDialog.close();
  if (deletingDetail) hideDetail();
  showToast("일기가 삭제되었습니다.");
  statusMessage.textContent = "일기가 삭제되었습니다.";
});

deleteDialog?.addEventListener("cancel", () => {
  pendingDeleteEntry = null;
});

writeForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const isEditing = Boolean(editingEntry);
  const mood = writeForm.elements["write-mood"].value;
  const seed = diarySeeds.find((entry) => entry.mood === mood) || diarySeeds[0];
  const title = writeForm.elements.title.value.trim();
  const content = writeForm.elements.content.value.trim();
  if (editingEntry) {
    Object.assign(editingEntry, { mood, label: seed.label, color: seed.color, image: seed.image, title, content });
    saveDiaryEntries();
    renderDiary();
    renderRoute();
  } else {
    diaryEntries.unshift({ ...seed, id: Date.now(), date: todayLabel(), title, content, reflections: [] });
    saveDiaryEntries();
    currentPage = 1;
    renderDiary();
    location.hash = "#diary";
  }
  writeDialog.close();
  writeForm.reset();
  editingEntry = null;
  successDialogTitle.textContent = isEditing ? "수정 완료" : "등록 완료";
  successDialogMessage.textContent = isEditing ? "일기가 수정되었습니다." : "일기가 등록되었습니다.";
  successDialog.showModal();
  statusMessage.textContent = isEditing ? "일기가 수정되었습니다." : "일기가 등록되었습니다.";
});

themeToggle?.addEventListener("change", () => setTheme(themeToggle.checked));

scrollTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const savedTheme = localStorage.getItem("diary-theme");
setTheme(savedTheme === "dark");
if (!isDetailPage) {
  renderGallery();
  renderDiary();
  window.addEventListener("hashchange", renderRoute);
  if (!location.hash) history.replaceState(null, "", "#diary");
}
renderRoute();

console.assert(!gallery || gallery.querySelectorAll(".gallery__item").length === galleryImages.length, "Gallery render failed.");
console.assert(diarySeeds.length === 4, "Diary mood cards are missing.");
console.assert(diaryEntries.length > 0, "Diary data is missing.");
