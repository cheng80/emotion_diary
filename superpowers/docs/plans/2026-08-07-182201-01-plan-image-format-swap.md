# 반려동물 사진 JPG 교체

**Goal:** 지정된 반려동물 사진 10개와 배너 이미지를 PNG 경로에서 같은 이름의 JPG 파일로 교체한다.
**Why planning is required:** Git이 추적하는 기존 이미지 삭제가 포함된다.
**Acceptance:** 지정된 JPG 11개가 유효하고 대응하는 PNG와 해상도 및 표시 내용이 같아야 하며, 정확히 해당 PNG 11개만 제거하고 JPG 11개만 Git에 등록한다. 다른 사용자 변경은 보존한다. 문제가 있으면 삭제 전에 중단하며, 기존 PNG는 현재 Git 기록에서 복구할 수 있어야 한다.

### Outcome 1: 교체 대상 검증
- Work: `assets/01-alvan-nee`부터 `assets/10-alvan-nee` 및 `assets/hero`의 PNG와 JPG 존재 여부, 형식, 해상도와 표시 내용을 비교한다.
- Verify: `sips -g pixelWidth -g pixelHeight assets/<name>.{png,jpg}`

### Outcome 2: 지정 이미지 교체
- Work: 검증한 PNG 11개만 제거하고 같은 이름의 JPG 11개를 Git에 등록한다.
- Risks/open questions: `diary-*`, `mood-happy.png` 등 기존 사용자 변경은 대상에서 제외한다.
- Verify: `git status --short assets`
