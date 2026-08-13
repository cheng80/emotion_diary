const diaryStorageKey = "homework-diary-list";
const toastStorageKey = "homework-toast-message";
const themeStorageKey = "homework-dark-mode";
const dogApiUrl = "https://dog.ceo/api/breeds/image/random/10";

// 08/12 과제: 한 페이지에 표시할 일기 수
const diaryPageSize = 8;

const defaultDiaryList = [];

let diaryList = [];
let selectedMood = "전체";
let searchKeyword = "";
let selectedDiary = {};
let editingDiary = false;
let deletingDiaryNumber = 0;
let dogImageList = [];
let photoRatio = "square";
let photoLoading = false;
let searchTimer = 0;
let photoScrollTimer = 0;
let photoScrollReady = true;
// 08/13 과제: 모달을 닫을 때 이전 초점으로 돌아가기 위한 기록
let modalFocusHistory = [];

// 08/12 과제: 현재 선택한 일기 목록 페이지
let currentDiaryPage = 1;

const moodImages = {
	"행복해요": "../images/diary-happy.png",
	"슬퍼요": "../images/diary-sad.png",
	"놀랐어요": "../images/diary-surprised.png",
	"화나요": "../images/diary-angry.png"
};

// 감정에 맞는 카드 배경 클래스를 반환
function getMoodBackground(mood) {
	if (mood === "행복해요") return "mood-happy";
	if (mood === "슬퍼요") return "mood-sad";
	if (mood === "놀랐어요") return "mood-surprised";
	return "mood-angry";
}

// 감정에 맞는 글자색 클래스를 반환
function getMoodTextClass(mood) {
	if (mood === "행복해요") return "happy-text";
	if (mood === "슬퍼요") return "sad-text";
	if (mood === "놀랐어요") return "surprised-text";
	return "angry-text";
}

// 일기 목록을 브라우저 저장소에 저장
function saveDiaryList() {
	localStorage.setItem(diaryStorageKey, JSON.stringify(diaryList));
}

// 08/11·08/13 과제: 다크모드 선택값과 접근성 상태를 모든 스위치에 적용
function applyTheme(darkMode) {
	if (darkMode) {
		document.body.classList.add("dark-mode");
	} else {
		document.body.classList.remove("dark-mode");
	}

	document.querySelectorAll(".theme-switch input").forEach(function (toggle) {
		toggle.checked = darkMode;
		toggle.setAttribute("aria-checked", String(darkMode));
	});
}

// 저장된 다크모드 선택값을 화면과 체크박스에 적용
function prepareTheme() {
	applyTheme(localStorage.getItem(themeStorageKey) === "true");
}

// 체크박스 선택에 따라 다크모드를 전환하고 선택값을 저장
function changeTheme(event) {
	const darkMode = event.target.checked;
	applyTheme(darkMode);
	localStorage.setItem(themeStorageKey, String(darkMode));
}

// 08/07 과제: 전달받은 문구를 화면 하단 토스트로 표시
function showToast(message) {
	document.getElementById("toast-area").innerHTML = '<div class="toast-message">' + message + "</div>";
}

// 상세 페이지에서 전달된 토스트 메시지를 표시
function showSavedToast() {
	const savedToast = localStorage.getItem(toastStorageKey);

	if (savedToast === null || savedToast === "") return;

	showToast(savedToast);
	localStorage.setItem(toastStorageKey, "");
}

// 08/07·08/13 과제: 모달을 열고 첫 조작 요소로 초점을 이동한 뒤 뒷배경 스크롤을 막는다.
function openModal(id) {
	const modal = document.getElementById(id);
	modalFocusHistory.push(document.activeElement);
	window.scrollTo({ top: 0 });
	document.body.style.overflow = "hidden";
	modal.style.display = "flex";

	const firstControl = modal.querySelector("button:not([disabled]), input:not([disabled]), textarea:not([disabled])");
	if (firstControl !== null) firstControl.focus();
}

// 08/07·08/13 과제: 모달을 닫고 뒷배경 스크롤과 이전 초점을 복원
function closeModal(id) {
	document.getElementById(id).style.display = "none";
	document.body.style.overflow = "";

	const previousFocus = modalFocusHistory.pop();
	if (previousFocus !== undefined && typeof previousFocus.focus === "function") previousFocus.focus();
}

// 브라우저 저장소에서 일기 목록을 불러온다.
function loadDiaryList() {
	const savedDiaryList = localStorage.getItem(diaryStorageKey);

	if (savedDiaryList === null) {
		diaryList = defaultDiaryList;
		saveDiaryList();
		return;
	}

	try {
		const parsedDiaryList = JSON.parse(savedDiaryList);

		if (Array.isArray(parsedDiaryList)) {
			diaryList = parsedDiaryList;
		} else {
			diaryList = defaultDiaryList;
			saveDiaryList();
		}
	} catch (error) {
		diaryList = defaultDiaryList;
		saveDiaryList();
	}
}

// 08/10·08/13 과제: 현재 탭 상태를 보조 기술에 제공하는 보관함 메뉴를 반환
function getLibraryTabs(selectedLibrary) {
	const diaryClass = selectedLibrary === "diary" ? "tab tab-selected" : "tab";
	const photoClass = selectedLibrary === "photos" ? "tab tab-selected" : "tab";
	const diaryCurrent = selectedLibrary === "diary" ? "page" : "false";
	const photoCurrent = selectedLibrary === "photos" ? "page" : "false";

	return `
		<nav class="tabs" aria-label="다이어리 메뉴">
			<button class="${diaryClass}" type="button" aria-current="${diaryCurrent}" onclick="changeLibraryView('diary')">일기보관함</button>
			<button class="${photoClass}" type="button" aria-current="${photoCurrent}" onclick="changeLibraryView('photos')">사진보관함</button>
		</nav>
	`;
}

// 08/11 과제: CSS 변수로 커스텀 드롭다운의 선택 문구를 표시
function setDropdownValue(titleId, value) {
	document.getElementById(titleId).style.setProperty("--dropdown-value", '"' + value + '"');
}

// 08/11 과제: 커스텀 드롭다운 값을 표시하고 목록을 닫음
function closeDropdown(event, titleId) {
	setDropdownValue(titleId, event.target.dataset.label);
	document.getElementById(titleId).checked = false;
}

// 사진 비율 값에 맞는 표시 문구를 반환
function getPhotoRatioLabel(ratio) {
	if (ratio === "wide") return "가로형";
	if (ratio === "portrait") return "세로형";
	return "기본형";
}

// 08/10·08/13 과제: 접근 가능한 이름과 상태를 포함한 일기보관함을 표시
function renderDiaryStorage() {
	document.getElementById("library-content").innerHTML = `
		${getLibraryTabs("diary")}
		<div class="toolbar">
			<div class="filters">
				<div class="custom-dropdown filter-dropdown">
					<input class="dropdown-title" id="mood-dropdown-title" type="checkbox" aria-label="감정 필터 열기" />
					<ul class="dropdown-list">
						<li><input id="mood-all" type="radio" name="mood-filter" value="전체" data-label="전체" onclick="changeMood(event)" ${selectedMood === "전체" ? "checked" : ""} /><label for="mood-all">전체</label></li>
						<li><input id="mood-sad" type="radio" name="mood-filter" value="슬퍼요" data-label="슬퍼요" onclick="changeMood(event)" ${selectedMood === "슬퍼요" ? "checked" : ""} /><label for="mood-sad">슬퍼요</label></li>
						<li><input id="mood-surprised" type="radio" name="mood-filter" value="놀랐어요" data-label="놀랐어요" onclick="changeMood(event)" ${selectedMood === "놀랐어요" ? "checked" : ""} /><label for="mood-surprised">놀랐어요</label></li>
						<li><input id="mood-angry" type="radio" name="mood-filter" value="화나요" data-label="화나요" onclick="changeMood(event)" ${selectedMood === "화나요" ? "checked" : ""} /><label for="mood-angry">화나요</label></li>
						<li><input id="mood-happy" type="radio" name="mood-filter" value="행복해요" data-label="행복해요" onclick="changeMood(event)" ${selectedMood === "행복해요" ? "checked" : ""} /><label for="mood-happy">행복해요</label></li>
					</ul>
				</div>
				<label class="search-label">
					<input id="diary-search" class="search-input" type="text" aria-label="일기 검색" placeholder="검색어를 입력해 주세요." oninput="changeSearch(event)" />
				</label>
			</div>
			<button class="write-button" type="button" onclick="openWriteModal()">
				<img src="../images/add.svg" alt="" aria-hidden="true" />
				일기쓰기
			</button>
		</div>
		<section class="diary-grid" id="diary-grid" aria-label="일기 목록" aria-live="polite"></section>
		<!-- 08/12 과제: 이전·다음 버튼과 페이지 번호를 표시 -->
		<nav class="pagination" id="pagination" aria-label="일기 목록 페이지">
			<button class="pagination-arrow" id="previous-page" type="button" aria-label="이전 페이지" onclick="changeDiaryPage(currentDiaryPage - 1)">
				<img src="../images/chevron-right.svg" alt="" aria-hidden="true" />
			</button>
			<div class="pagination-numbers" id="page-numbers"></div>
			<button class="pagination-arrow" id="next-page" type="button" aria-label="다음 페이지" onclick="changeDiaryPage(currentDiaryPage + 1)">
				<img src="../images/chevron-left.svg" alt="" aria-hidden="true" />
			</button>
		</nav>
	`;

	setDropdownValue("mood-dropdown-title", selectedMood);
	document.getElementById("diary-search").value = searchKeyword;
	filterDiaryList();
}

// 08/10·08/13 과제: 접근 가능한 이름과 로딩 상태를 포함한 사진보관함을 표시
function renderPhotoStorage() {
	document.getElementById("library-content").innerHTML = `
		${getLibraryTabs("photos")}
		<div class="photo-toolbar">
			<div class="photo-ratio-field">
				<span>사진 비율</span>
				<div class="custom-dropdown photo-ratio-dropdown">
					<input class="dropdown-title" id="photo-ratio-dropdown-title" type="checkbox" aria-label="사진 비율 열기" />
					<ul class="dropdown-list">
						<li><input id="photo-square" type="radio" name="photo-ratio" value="square" data-label="기본형" onclick="changePhotoRatio(event)" ${photoRatio === "square" ? "checked" : ""} /><label for="photo-square">기본형</label></li>
						<li><input id="photo-wide" type="radio" name="photo-ratio" value="wide" data-label="가로형" onclick="changePhotoRatio(event)" ${photoRatio === "wide" ? "checked" : ""} /><label for="photo-wide">가로형</label></li>
						<li><input id="photo-portrait" type="radio" name="photo-ratio" value="portrait" data-label="세로형" onclick="changePhotoRatio(event)" ${photoRatio === "portrait" ? "checked" : ""} /><label for="photo-portrait">세로형</label></li>
					</ul>
				</div>
			</div>
			<button class="primary-button" id="photo-reload" type="button" onclick="loadDogImages()" ${photoLoading ? "disabled" : ""}>새로 불러오기</button>
		</div>
		<section class="photo-gallery photo-gallery-${photoRatio}" id="photo-gallery" aria-label="강아지 사진 목록" aria-live="polite" aria-busy="false"></section>
	`;

	setDropdownValue("photo-ratio-dropdown-title", getPhotoRatioLabel(photoRatio));

	if (dogImageList.length > 0) {
		renderDogImages(dogImageList, false);
		return;
	}

	renderPhotoSkeletons();
	loadDogImages();
}

// 08/10 과제: 탭에서 선택한 보관함 컴포넌트로 전환
function changeLibraryView(library) {
	if (library === "photos") {
		renderPhotoStorage();
	} else {
		renderDiaryStorage();
	}
}

// 08/13 과제: 키보드로 상세 이동이 가능한 일기 카드를 최신순으로 표시
function renderDiaryList(list) {
	let diaryHtml = list.map(function (diary, index) {
		diary = list[list.length - index - 1];

		return `
			<article class="diary-card">
				<button class="card-delete" type="button" aria-label="일기 삭제" onclick="deleteDiaryFromList(event, ${diary.number})"><span class="delete-icon"><img src="../images/close.svg" alt="" aria-hidden="true" /></span></button>
				<button class="card-open" type="button" aria-label="일기 상세 보기" onclick="openDiary(${diary.number})"></button>
				<div class="card-visual ${getMoodBackground(diary.mood)}"><img src="${moodImages[diary.mood] || moodImages["화나요"]}" alt="${diary.mood} 감정 일기 이미지" /></div>
				<div class="card-body">
					<div class="card-info">
						<strong class="${getMoodTextClass(diary.mood)}">${diary.mood}</strong>
						<span class="date">${diary.date}</span>
					</div>
					<h2>${diary.title}</h2>
				</div>
			</article>
		`;
	}).join("");

	if (diaryHtml === "") {
		diaryHtml = '<p class="empty-message">일기가 없습니다.</p>';
	}

	document.getElementById("diary-grid").innerHTML = diaryHtml;
}

// 08/12 과제: 페이지 번호와 현재 페이지의 active 색상을 표시
function renderPagination(totalPages) {
	const pagination = document.getElementById("pagination");

	if (pagination === null) return;

	pagination.hidden = totalPages < 2;
	document.getElementById("page-numbers").innerHTML = new Array(totalPages).fill("페이지").map(function (page, index) {
		const pageNumber = index + 1;
		const activeClass = pageNumber === currentDiaryPage ? " pagination-active" : "";
		const currentPage = pageNumber === currentDiaryPage ? "page" : "false";

		return `<button class="pagination-number${activeClass}" type="button" aria-label="${pageNumber}페이지" aria-current="${currentPage}" onclick="changeDiaryPage(${pageNumber})">${pageNumber}</button>`;
	}).join("");
	document.getElementById("previous-page").disabled = currentDiaryPage === 1;
	document.getElementById("next-page").disabled = currentDiaryPage === totalPages;
}

// 선택한 감정과 검색어에 맞는 일기만 표시
function filterDiaryList() {
	const filteredDiaryList = diaryList.filter(function (diary) {
		const matchesMood = selectedMood === "전체" || diary.mood === selectedMood;
		const matchesKeyword = diary.title.includes(searchKeyword) || diary.content.includes(searchKeyword);

		return matchesMood && matchesKeyword;
	});

	const totalPages = Math.max(1, Math.ceil(filteredDiaryList.length / diaryPageSize));
	currentDiaryPage = Math.max(1, Math.min(currentDiaryPage, totalPages));
	const lastIndex = filteredDiaryList.length - 1 - (currentDiaryPage - 1) * diaryPageSize;
	const firstIndex = lastIndex - diaryPageSize + 1;
	const currentPageDiaryList = filteredDiaryList.filter(function (diary, index) {
		return firstIndex <= index && index <= lastIndex;
	});

	renderDiaryList(currentPageDiaryList);
	renderPagination(totalPages);
}

// 08/12 과제: 선택한 페이지로 이동해 일기 목록을 다시 표시
function changeDiaryPage(page) {
	currentDiaryPage = page;
	filterDiaryList();
}

// 감정 선택값을 바꾸고 드롭다운을 닫은 뒤 목록을 다시 표시
function changeMood(event) {
	selectedMood = event.target.value;
	currentDiaryPage = 1;
	closeDropdown(event, "mood-dropdown-title");
	filterDiaryList();
}

// 08/11 과제: 마지막 입력 700ms 후 검색 결과를 표시
function changeSearch(event) {
	searchKeyword = event.target.value;
	currentDiaryPage = 1;
	clearTimeout(searchTimer);
	searchTimer = setTimeout(function () {
		if (document.getElementById("diary-grid") !== null) filterDiaryList();
	}, 700);
}

// 08/10·08/13 과제: 보조 기술에 로딩 상태를 알리고 그라데이션 스켈레톤을 표시
function renderPhotoSkeletons() {
	const gallery = document.getElementById("photo-gallery");

	if (gallery === null) return;
	gallery.setAttribute("aria-busy", "true");

	let skeletonHtml = "";

	for (let index = 0; index < 10; index++) {
		skeletonHtml += `
			<div class="photo-card" aria-hidden="true">
				<div class="photo-skeleton"><div class="photo-skeleton-bar"></div></div>
			</div>
		`;
	}

	gallery.innerHTML = skeletonHtml;
}

// 08/10·08/11·08/13 과제: 로딩 상태와 대체 텍스트를 반영해 강아지 이미지를 표시
function renderDogImages(imageList, append) {
	const gallery = document.getElementById("photo-gallery");

	if (gallery === null) return;
	gallery.setAttribute("aria-busy", "false");

	const photoHtml = imageList.map(function (imageUrl) {
		return `
			<figure class="photo-card">
				<div class="photo-skeleton" aria-hidden="true"><div class="photo-skeleton-bar"></div></div>
				<img src="${imageUrl}" alt="강아지 사진" />
			</figure>
		`;
	}).join("");

	if (append === true) {
		gallery.insertAdjacentHTML("beforeend", photoHtml);
	} else {
		gallery.innerHTML = photoHtml;
	}
}

// 08/10·08/13 과제: 로딩 상태를 해제하고 API 재시도 안내를 표시
function renderPhotoError() {
	const gallery = document.getElementById("photo-gallery");

	if (gallery === null) return;
	gallery.setAttribute("aria-busy", "false");

	gallery.innerHTML = `
		<div class="photo-load-error">
			<p>강아지 사진을 불러오지 못했습니다.</p>
			<button class="primary-button" type="button" onclick="loadDogImages()">다시 불러오기</button>
		</div>
	`;
}

// 08/10·08/11·08/13 과제: 추가 로딩 상태를 알리고 강아지 이미지 10개를 표시
async function loadDogImages(append) {
	if (photoLoading) return;

	const appendImages = append === true;
	photoLoading = true;
	const reloadButton = document.getElementById("photo-reload");
	if (reloadButton !== null) reloadButton.disabled = true;

	if (appendImages) {
		const gallery = document.getElementById("photo-gallery");
		if (gallery !== null) gallery.insertAdjacentHTML("beforeend", '<p class="photo-loading-more" id="photo-loading-more" role="status">사진 10장을 더 불러오는 중...</p>');
	} else {
		renderPhotoSkeletons();
	}

	try {
		const response = await fetch(dogApiUrl);

		if (!response.ok) {
			throw new Error("강아지 API 요청에 실패했습니다.");
		}

		const result = await response.json();

		if (result.status !== "success" || Array.isArray(result.message) === false) {
			throw new Error("강아지 이미지 응답 형식이 올바르지 않습니다.");
		}

		if (appendImages) {
			const loadingMore = document.getElementById("photo-loading-more");
			if (loadingMore !== null) loadingMore.remove();
			dogImageList = dogImageList.concat(result.message);
			renderDogImages(result.message, true);

			const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			photoScrollReady = scrollableHeight > 0 && document.documentElement.scrollTop / scrollableHeight < 0.7;
		} else {
			dogImageList = result.message;
			renderDogImages(dogImageList, false);
		}
	} catch (error) {
		console.error(error);

		if (appendImages) {
			const loadingMore = document.getElementById("photo-loading-more");
			if (loadingMore !== null) loadingMore.remove();
			photoScrollReady = true;
			showToast("사진을 더 불러오지 못했습니다.");
		} else {
			dogImageList = [];
			renderPhotoError();
		}
	} finally {
		photoLoading = false;
		const reloadButton = document.getElementById("photo-reload");
		if (reloadButton !== null) reloadButton.disabled = false;
	}
}

// 08/10·08/11 과제: 선택한 비율 클래스를 적용하고 드롭다운을 닫음
function changePhotoRatio(event) {
	photoRatio = event.target.value;
	closeDropdown(event, "photo-ratio-dropdown-title");

	const gallery = document.getElementById("photo-gallery");
	gallery.className = "photo-gallery photo-gallery-" + photoRatio;
}

// 메인 페이지의 일기와 토스트를 준비
function prepareMainPage() {
	loadDiaryList();
	renderDiaryStorage();
	showSavedToast();
}

// 선택한 일기의 상세 페이지로 이동
function openDiary(number) {
	location.href = "./detail.html?number=" + number;
}

// 08/05 과제: 이벤트 버블링을 막고 카드에서 선택한 일기를 삭제
function deleteDiaryFromList(event, number) {
	event.stopPropagation();
	deletingDiaryNumber = number;
	openModal("delete-modal");
}

// 08/07 과제: 빈 입력값으로 일기 작성 모달을 연다.
function openWriteModal() {
	editingDiary = false;
	document.getElementById("write-modal-title").innerText = "일기 쓰기";
	document.getElementById("write-submit").innerText = "등록하기";
	document.getElementById("write-title").value = "";
	document.getElementById("write-content").value = "";
	document.getElementById("write-happy").checked = true;
	document.getElementById("write-submit").disabled = true;
	openModal("write-modal");
}

// 08/07 과제: 일기 작성 또는 수정 취소 여부를 확인
function closeWriteModal() {
	hideWriteModal();
	document.getElementById("cancel-modal-title").innerText = editingDiary ? "일기 수정을 취소할까요?" : "일기 작성을 취소할까요?";
	document.getElementById("cancel-confirm").innerText = editingDiary ? "수정 취소" : "작성 취소";
	openModal("cancel-modal");
}

// 08/07 과제: 작성 또는 수정 모달을 닫기
function hideWriteModal() {
	closeModal("write-modal");
}

// 08/07 과제: 취소 확인 모달을 닫고 일기 작성 또는 수정으로 돌아가기
function keepWriting() {
	closeModal("cancel-modal");
	openModal("write-modal");
}

// 08/07 과제: 일기 작성 또는 수정을 취소
function discardWriting() {
	closeModal("cancel-modal");
	editingDiary = false;
}

// 08/07 과제: 일기 등록 또는 수정 완료 안내 모달을 닫기
function closeSuccessModal() {
	closeModal("success-modal");
}

// 작성 폼에서 선택한 감정을 반환
function getSelectedMood() {
	if (document.getElementById("write-happy").checked) return "행복해요";
	if (document.getElementById("write-sad").checked) return "슬퍼요";
	if (document.getElementById("write-surprised").checked) return "놀랐어요";
	return "화나요";
}

// 감정에 맞는 이모지를 반환
function getMoodEmoji(mood) {
	if (mood === "행복해요") return "😊";
	if (mood === "슬퍼요") return "😢";
	if (mood === "놀랐어요") return "😲";
	return "😠";
}

// 제목과 내용 입력 여부에 따라 저장 버튼을 제어
function checkWriteButton() {
	const title = document.getElementById("write-title").value;
	const content = document.getElementById("write-content").value;
	document.getElementById("write-submit").disabled = title === "" || content === "";
}

// 작성 상태에 따라 일기를 등록하거나 수정
function submitDiary() {
	if (editingDiary) {
		updateDiary();
	} else {
		addDiary();
	}
}

// 08/07 과제: 새 일기를 등록하고 완료 안내 모달을 표시
function addDiary() {
	const mood = getSelectedMood();
	const today = new Date();
	const date = today.getFullYear() + ". " + (today.getMonth() + 1) + ". " + today.getDate();

	const newDiary = {
		number: today.getTime(),
		mood: mood,
		emoji: getMoodEmoji(mood),
		date: date,
		title: document.getElementById("write-title").value,
		content: document.getElementById("write-content").value,
		reflections: []
	};

	diaryList.push(newDiary);
	saveDiaryList();

	document.getElementById("write-title").value = "";
	document.getElementById("write-content").value = "";
	document.getElementById("write-happy").checked = true;
	document.getElementById("write-submit").disabled = true;

	hideWriteModal();
	selectedMood = "전체";
	searchKeyword = "";
	currentDiaryPage = 1;
	document.getElementById("mood-all").checked = true;
	setDropdownValue("mood-dropdown-title", selectedMood);
	document.getElementById("diary-search").value = searchKeyword;
	filterDiaryList();
	openModal("success-modal");
}

// 선택한 일기의 상세 내용을 화면에 표시
function renderDetail() {
	document.getElementById("detail-title").innerText = selectedDiary.title;
	document.getElementById("detail-emoji").alt = selectedDiary.mood + " 감정";
	document.getElementById("detail-mood").innerText = selectedDiary.mood;
	document.getElementById("detail-mood").className = getMoodTextClass(selectedDiary.mood);
	document.getElementById("detail-date").innerText = selectedDiary.date + " 작성";
	document.getElementById("detail-body").innerText = selectedDiary.content;
}

// 선택한 일기의 회고 목록을 화면에 표시
function renderReflections() {
	let reflectionHtml = selectedDiary.reflections.map(function (reflection, index) {
		const content = reflection.content === undefined ? reflection : reflection.content;
		const date = reflection.date === undefined ? "2024. 09. 24" : reflection.date;
		const itemClass = index === selectedDiary.reflections.length - 1 ? "reflection-item reflection-item-last" : "reflection-item";

		return `
			<div class="${itemClass}">
				<span>${content}</span>
				<span class="reflection-date">[${date}]</span>
			</div>
		`;
	}).join("");

	if (reflectionHtml === "") {
		reflectionHtml = '<div class="reflection-empty">등록된 회고가 없습니다.</div>';
	}

	document.getElementById("reflection-list").innerHTML = reflectionHtml;
}

// 주소의 일기 번호로 상세 페이지를 준비
function prepareDetailPage() {
	loadDiaryList();

	const query = new URLSearchParams(location.search);
	const diaryNumber = query.get("number");

	if (diaryNumber === null) {
		location.href = "./main.html";
		return;
	}

	const foundDiaryList = diaryList.filter(function (diary) {
		return String(diary.number) === diaryNumber;
	});

	if (foundDiaryList.length === 0) {
		alert("일기를 찾을 수 없습니다.");
		location.href = "./main.html";
		return;
	}

	selectedDiary = foundDiaryList[0];

	if (selectedDiary.reflections === undefined) {
		selectedDiary.reflections = [];
	}

	renderDetail();
	renderReflections();
}

// 기존 일기 내용을 채워 수정 모달을 연다.
function editDiary() {
	editingDiary = true;
	document.getElementById("write-modal-title").innerText = "일기 수정";
	document.getElementById("write-submit").innerText = "수정하기";
	document.getElementById("write-happy").checked = selectedDiary.mood === "행복해요";
	document.getElementById("write-sad").checked = selectedDiary.mood === "슬퍼요";
	document.getElementById("write-surprised").checked = selectedDiary.mood === "놀랐어요";
	document.getElementById("write-angry").checked = selectedDiary.mood === "화나요";
	document.getElementById("write-title").value = selectedDiary.title;
	document.getElementById("write-content").value = selectedDiary.content;
	document.getElementById("write-submit").disabled = false;
	openModal("write-modal");
}

// 08/07 과제: 수정한 일기 내용을 저장하고 완료 안내 모달을 표시
function updateDiary() {
	const mood = getSelectedMood();

	selectedDiary.mood = mood;
	selectedDiary.emoji = getMoodEmoji(mood);
	selectedDiary.title = document.getElementById("write-title").value;
	selectedDiary.content = document.getElementById("write-content").value;
	saveDiaryList();
	editingDiary = false;
	hideWriteModal();
	renderDetail();
	openModal("success-modal");
}

// 08/13 과제: Clipboard API가 없는 브라우저에서 입력 요소로 복사 기능을 대체
function copyTextFallback(text) {
	const copyArea = document.createElement("textarea");
	copyArea.value = text;
	copyArea.setAttribute("readonly", "");
	copyArea.style.position = "fixed";
	copyArea.style.opacity = "0";
	document.body.appendChild(copyArea);
	copyArea.select();
	let copied = false;

	try {
		copied = document.execCommand("copy");
	} catch (error) {
		copied = false;
	}

	copyArea.remove();
	return copied;
}

// 08/07·08/13 과제: 일기 내용을 클립보드에 복사하고 브라우저별 결과를 안내
function copyDiaryContent() {
	function showCopyResult(copied) {
		showToast(copied ? "내용이 복사되었습니다." : "내용을 복사하지 못했습니다.");
	}

	if (navigator.clipboard !== undefined && navigator.clipboard.writeText !== undefined) {
		navigator.clipboard.writeText(selectedDiary.content).then(function () {
			showCopyResult(true);
		}).catch(function () {
			showCopyResult(copyTextFallback(selectedDiary.content));
		});
		return;
	}

	showCopyResult(copyTextFallback(selectedDiary.content));
}

// 08/07 과제: 삭제 확인 모달을 연다.
function deleteDiary() {
	deletingDiaryNumber = selectedDiary.number;
	openModal("delete-modal");
}

// 08/07 과제: 삭제 확인 모달을 닫기
function closeDeleteModal() {
	deletingDiaryNumber = 0;
	closeModal("delete-modal");
}

// 08/05 과제·08/07 과제: 확인한 일기를 삭제하고 현재 화면에 결과를 반영
function confirmDeleteDiary() {
	diaryList = diaryList.filter(function (diary) {
		return diary.number !== deletingDiaryNumber;
	});

	saveDiaryList();
	closeDeleteModal();

	if (document.getElementById("diary-grid") !== null) {
		filterDiaryList();
		showToast("일기가 삭제 되었습니다.");
		return;
	}

	localStorage.setItem(toastStorageKey, "일기가 삭제 되었습니다.");
	location.href = "./main.html";
}

// 08/05 과제: 새 회고를 등록하고 회고 위치로 부드럽게 이동
function addReflection() {
	const reflectionInput = document.getElementById("reflection-input");
	const reflection = reflectionInput.value;

	if (reflection === "") {
		alert("회고를 입력해 주세요.");
		return;
	}

	const today = new Date();
	let month = today.getMonth() + 1;
	let date = today.getDate();

	if (month < 10) month = "0" + month;
	if (date < 10) date = "0" + date;

	const newReflection = {
		content: reflection,
		date: today.getFullYear() + ". " + month + ". " + date
	};

	selectedDiary.reflections.push(newReflection);
	saveDiaryList();
	reflectionInput.value = "";
	renderReflections();
	location.href = "#reflection-list";
}

// 08/05 과제: 화면을 맨 위로 부드럽게 이동
function scrollToTop() {
	window.scrollTo({ top: 0, behavior: "smooth" });
}

// 08/11 과제: 사진보관함에서 700ms마다 스크롤 위치를 확인해 사진 10개를 추가
window.addEventListener("scroll", function () {
	if (document.getElementById("photo-gallery") === null || photoScrollTimer !== 0) return;

	photoScrollTimer = setTimeout(function () {
		photoScrollTimer = 0;

		if (document.getElementById("photo-gallery") === null) return;

		const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
		if (scrollableHeight <= 0) return;

		const scrollRatio = document.documentElement.scrollTop / scrollableHeight;

		if (scrollRatio < 0.7) {
			photoScrollReady = true;
			return;
		}

		if (photoScrollReady) {
			photoScrollReady = false;
			loadDogImages(true);
		}
	}, 700);
});

// 08/07 과제: ESC 키로 현재 열려 있는 모달을 닫기
window.addEventListener("keydown", function (event) {
	if (event.key !== "Escape") return;

	const deleteModal = document.getElementById("delete-modal");
	const cancelModal = document.getElementById("cancel-modal");
	const successModal = document.getElementById("success-modal");
	const writeModal = document.getElementById("write-modal");

	if (deleteModal !== null && deleteModal.style.display === "flex") {
		closeDeleteModal();
	} else if (cancelModal.style.display === "flex") {
		keepWriting();
	} else if (successModal !== null && successModal.style.display === "flex") {
		closeSuccessModal();
	} else if (writeModal.style.display === "flex") {
		closeWriteModal();
	}
});

// 페이지가 준비되는 동안 저장된 화면 모드를 먼저 적용
prepareTheme();

// 현재 페이지에 맞는 초기 화면을 준비
window.onload = function () {
	if (document.getElementById("library-content") !== null) {
		prepareMainPage();
	} else {
		prepareDetailPage();
	}
};
