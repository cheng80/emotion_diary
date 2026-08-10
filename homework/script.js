const diaryStorageKey = "homework-diary-list";
const toastStorageKey = "homework-toast-message";
const themeStorageKey = "homework-dark-mode";
const dogApiUrl = "https://dog.ceo/api/breeds/image/random/10";

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

const moodImages = {
	"행복해요": "../assets/diary-happy.png",
	"슬퍼요": "../assets/diary-sad.png",
	"놀랐어요": "../assets/diary-surprised.png",
	"화나요": "../assets/diary-angry.png"
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

// 저장된 다크모드 선택값을 화면과 체크박스에 적용
function prepareTheme() {
	const darkMode = localStorage.getItem(themeStorageKey) === "true";
	const themeToggle = document.getElementById("theme-toggle");

	if (darkMode) {
		document.body.classList.add("dark-mode");
	} else {
		document.body.classList.remove("dark-mode");
	}

	themeToggle.checked = darkMode;
}

// 체크박스 선택에 따라 다크모드를 전환하고 선택값을 저장
function changeTheme(event) {
	const darkMode = event.target.checked;

	if (darkMode) {
		document.body.classList.add("dark-mode");
	} else {
		document.body.classList.remove("dark-mode");
	}

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

// 08/07 과제: 모달을 열고 화면을 맨 위로 이동한 뒤 뒷배경 스크롤을 막는다.
function openModal(id) {
	window.scrollTo({ top: 0 });
	document.body.style.overflow = "hidden";
	document.getElementById(id).style.display = "flex";
}

// 08/07 과제: 모달을 닫고 뒷배경 스크롤을 다시 허용
function closeModal(id) {
	document.getElementById(id).style.display = "none";
	document.body.style.overflow = "";
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

// 08/10 과제: 선택한 보관함에 맞는 탭 컴포넌트를 반환
function getLibraryTabs(selectedLibrary) {
	const diaryClass = selectedLibrary === "diary" ? "tab tab-selected" : "tab";
	const photoClass = selectedLibrary === "photos" ? "tab tab-selected" : "tab";

	return `
		<div class="tabs">
			<button class="${diaryClass}" type="button" onclick="changeLibraryView('diary')">일기보관함</button>
			<button class="${photoClass}" type="button" onclick="changeLibraryView('photos')">사진보관함</button>
		</div>
	`;
}

// 08/10 과제: 일기보관함 컴포넌트를 화면에 표시
function renderDiaryStorage() {
	document.getElementById("library-content").innerHTML = `
		${getLibraryTabs("diary")}
		<div class="toolbar">
			<div class="filters">
				<select id="mood-filter" onchange="changeMood(event)">
					<option>전체</option>
					<option>슬퍼요</option>
					<option>놀랐어요</option>
					<option>화나요</option>
					<option>행복해요</option>
				</select>
				<label class="search-label">
					<input id="diary-search" class="search-input" type="text" placeholder="검색어를 입력해 주세요." oninput="changeSearch(event)" />
				</label>
			</div>
			<button class="write-button" type="button" onclick="openWriteModal()">
				<img src="../assets/add.svg" />
				일기쓰기
			</button>
		</div>
		<section class="diary-grid" id="diary-grid"></section>
	`;

	document.getElementById("mood-filter").value = selectedMood;
	document.getElementById("diary-search").value = searchKeyword;
	filterDiaryList();
}

// 08/10 과제: 사진보관함 컴포넌트를 화면에 표시
function renderPhotoStorage() {
	document.getElementById("library-content").innerHTML = `
		${getLibraryTabs("photos")}
		<div class="photo-toolbar">
			<label class="photo-ratio-field">
				<span>사진 비율</span>
				<select id="photo-ratio-select" class="photo-ratio-select" onchange="changePhotoRatio(event)">
					<option value="square">기본형</option>
					<option value="wide">가로형</option>
					<option value="portrait">세로형</option>
				</select>
			</label>
			<button class="primary-button" type="button" onclick="loadDogImages()">새로 불러오기</button>
		</div>
		<section class="photo-gallery photo-gallery-${photoRatio}" id="photo-gallery"></section>
	`;

	document.getElementById("photo-ratio-select").value = photoRatio;

	if (dogImageList.length > 0) {
		renderDogImages();
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

// 일기 목록을 최신순으로 카드에 표시
function renderDiaryList(list) {
	let diaryHtml = list.map(function (diary, index) {
		diary = list[list.length - index - 1];

		return `
			<article class="diary-card" onclick="openDiary(${diary.number})">
				<button class="card-delete" type="button" onclick="deleteDiaryFromList(event, ${diary.number})"><span class="delete-icon"><img src="../assets/close.svg" /></span></button>
				<div class="card-visual ${getMoodBackground(diary.mood)}"><img src="${moodImages[diary.mood] || moodImages["화나요"]}" /></div>
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

// 선택한 감정과 검색어에 맞는 일기만 표시
function filterDiaryList() {
	const filteredDiaryList = diaryList.filter(function (diary) {
		const matchesMood = selectedMood === "전체" || diary.mood === selectedMood;
		const matchesKeyword = diary.title.includes(searchKeyword) || diary.content.includes(searchKeyword);

		return matchesMood && matchesKeyword;
	});

	renderDiaryList(filteredDiaryList);
}

// 감정 선택값을 바꾸고 목록을 다시 표시
function changeMood(event) {
	selectedMood = event.target.value;
	filterDiaryList();
}

// 검색어를 바꾸고 목록을 다시 표시
function changeSearch(event) {
	searchKeyword = event.target.value;
	filterDiaryList();
}

// 08/10 과제: 강아지 이미지를 기다리는 동안 그라데이션 스켈레톤을 표시
function renderPhotoSkeletons() {
	const gallery = document.getElementById("photo-gallery");

	if (gallery === null) return;

	let skeletonHtml = "";

	for (let index = 0; index < 10; index++) {
		skeletonHtml += `
			<div class="photo-card">
				<div class="photo-skeleton"><div class="photo-skeleton-bar"></div></div>
			</div>
		`;
	}

	gallery.innerHTML = skeletonHtml;
}

// 08/10 과제: API에서 받은 강아지 이미지를 사진보관함에 표시
function renderDogImages() {
	const gallery = document.getElementById("photo-gallery");

	if (gallery === null) return;

	gallery.innerHTML = dogImageList.map(function (imageUrl, index) {
		return `
			<figure class="photo-card">
				<div class="photo-skeleton"><div class="photo-skeleton-bar"></div></div>
				<img src="${imageUrl}" />
			</figure>
		`;
	}).join("");
}

// 08/10 과제: 강아지 API 호출 실패 시 재시도 안내를 표시
function renderPhotoError() {
	const gallery = document.getElementById("photo-gallery");

	if (gallery === null) return;

	gallery.innerHTML = `
		<div class="photo-load-error">
			<p>강아지 사진을 불러오지 못했습니다.</p>
			<button class="primary-button" type="button" onclick="loadDogImages()">다시 불러오기</button>
		</div>
	`;
}

// 08/10 과제: 비동기 처리와 예외 처리를 적용해 강아지 이미지 10개를 불러옴
async function loadDogImages() {
	if (photoLoading) return;

	photoLoading = true;
	renderPhotoSkeletons();

	try {
		const response = await fetch(dogApiUrl);

		if (!response.ok) {
			throw new Error("강아지 API 요청에 실패했습니다.");
		}

		const result = await response.json();

		if (result.status !== "success" || result.message === undefined) {
			throw new Error("강아지 이미지 응답 형식이 올바르지 않습니다.");
		}

		dogImageList = result.message;
		renderDogImages();
	} catch (error) {
		dogImageList = [];
		console.error(error);
		renderPhotoError();
	} finally {
		photoLoading = false;
	}
}

// 08/10 과제: 선택한 비율 클래스를 사진 목록에 적용
function changePhotoRatio(event) {
	photoRatio = event.target.value;

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
	document.getElementById("mood-filter").value = selectedMood;
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

// 08/07 과제: 일기 내용을 클립보드에 복사하고 토스트를 표시
function copyDiaryContent() {
	navigator.clipboard.writeText(selectedDiary.content);
	showToast("내용이 복사되었습니다.");
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
