const diaryStorageKey = "homework-diary-list";
const toastStorageKey = "homework-toast-message";

const defaultDiaryList = [];

let diaryList = [];
let selectedMood = "전체";
let selectedDiary = {};
let editingDiary = false;

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

// 감정에 맞는 상세 글자색을 반환
function getMoodColor(mood) {
	if (mood === "행복해요") return "#ff5b5b";
	if (mood === "슬퍼요") return "#29b6d6";
	if (mood === "놀랐어요") return "#dd9d20";
	return "#777777";
}

// 일기 목록을 브라우저 저장소에 저장
function saveDiaryList() {
	localStorage.setItem(diaryStorageKey, JSON.stringify(diaryList));
}

// 전달받은 문구로 토스트 메시지를 표시
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

// 브라우저 저장소에서 일기 목록을 불러온다.
function loadDiaryList() {
	const savedDiaryList = localStorage.getItem(diaryStorageKey);

	if (savedDiaryList === null) {
		diaryList = defaultDiaryList;
		saveDiaryList();
	} else {
		diaryList = JSON.parse(savedDiaryList);
	}
}

// 일기 목록을 최신순으로 카드에 표시
function renderDiaryList(list) {
	let diaryHtml = list.map(function (diary, index) {
		diary = list[list.length - index - 1];

		return `
			<article class="diary-card" onclick="openDiary(${diary.number})">
				<button class="card-delete" type="button" aria-label="일기 삭제" onclick="deleteDiaryFromList(event, ${diary.number})"><span class="delete-icon"><img src="../assets/close.svg" alt="" aria-hidden="true" /></span></button>
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

// 선택한 감정에 맞는 일기만 표시
function filterDiaryList() {
	const filteredDiaryList = diaryList.filter(function (diary) {
		return selectedMood === "전체" || diary.mood === selectedMood;
	});

	renderDiaryList(filteredDiaryList);
}

// 감정 선택값을 바꾸고 목록을 다시 표시
function changeMood(event) {
	selectedMood = event.target.value;
	filterDiaryList();
}

// 메인 페이지의 일기와 토스트를 준비
function prepareMainPage() {
	loadDiaryList();
	renderDiaryList(diaryList);
	showSavedToast();
}

// 선택한 일기의 상세 페이지로 이동
function openDiary(number) {
	location.href = "./detail.html?number=" + number;
}

// 카드에서 선택한 일기를 삭제
function deleteDiaryFromList(event, number) {
	event.stopPropagation();

	const shouldDelete = confirm("이 일기를 삭제할까요?");
	if (shouldDelete === false) return;

	diaryList = diaryList.filter(function (diary) {
		return diary.number !== number;
	});

	saveDiaryList();
	filterDiaryList();
	showToast("일기가 삭제 되었습니다.");
}

// 빈 입력값으로 일기 작성 모달을 
function openWriteModal() {
	editingDiary = false;
	document.getElementById("write-modal-title").innerText = "일기 쓰기";
	document.getElementById("write-submit").innerText = "등록하기";
	document.getElementById("write-title").value = "";
	document.getElementById("write-content").value = "";
	document.getElementById("write-happy").checked = true;
	document.getElementById("write-submit").disabled = true;
	document.getElementById("write-modal").style.display = "flex";
}

// 작성 또는 수정 취소를 확인하고 모달을 닫는다.
function closeWriteModal() {
	let message = "작성 중인 내용이 저장되지 않습니다.\n취소하시겠습니까?";

	if (editingDiary) {
		message = "수정 중인 내용이 저장되지 않습니다.\n취소하시겠습니까?";
	}

	const shouldClose = confirm(message);
	if (shouldClose === false) return;

	hideWriteModal();
}

// 확인창 없이 작성 모달을 닫는다.
function hideWriteModal() {
	document.getElementById("write-modal").style.display = "none";
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

// 입력한 내용으로 새 일기를 등록
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
	filterDiaryList();
	showToast("일기가 등록 되었습니다.");
}

// 선택한 일기의 상세 내용을 화면에 표시
function renderDetail() {
	document.getElementById("detail-title").innerText = selectedDiary.title;
	document.getElementById("detail-emoji").alt = selectedDiary.mood + " 감정";
	document.getElementById("detail-mood").innerText = selectedDiary.mood;
	document.getElementById("detail-mood").style.color = getMoodColor(selectedDiary.mood);
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
	document.getElementById("write-modal").style.display = "flex";
}

// 수정한 일기 내용을 저장하고 화면을 갱신
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
	showToast("일기가 수정 되었습니다.");
}

// 상세 페이지의 일기를 삭제하고 메인으로 이동
function deleteDiary() {
	const shouldDelete = confirm("이 일기를 삭제할까요?");
	if (shouldDelete === false) return;

	diaryList = diaryList.filter(function (diary) {
		return diary.number !== selectedDiary.number;
	});

	saveDiaryList();
	localStorage.setItem(toastStorageKey, "일기가 삭제 되었습니다.");
	location.href = "./main.html";
}

// 날짜와 함께 새 회고를 등록
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

// 화면을 맨 위로 부드럽게 이동
function scrollToTop() {
	window.scrollTo({ top: 0, behavior: "smooth" });
}

// 현재 페이지에 맞는 초기 화면을 준비
window.onload = function () {
	if (document.getElementById("diary-grid") !== null) {
		prepareMainPage();
	} else {
		prepareDetailPage();
	}
};
