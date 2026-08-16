const sampleInput = `Stream 객체 정렬

[문제]
Product 객체 리스트를 가격 오름차순으로 정렬하여 출력하세요.

[데이터]
new Product("Laptop", 1500)
new Product("Phone", 800)
new Product("Tablet", 500)
new Product("Monitor", 300)

[요구사항]
- sorted() 메서드로 가격 오름차순 정렬
- Comparator.comparingInt() 사용
- 결과 출력

[소스]
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class StreamObjectSort {
    static class Product {
        String name;
        int price;

        public Product(String name, int price) {
            this.name = name;
            this.price = price;
        }

        public String getName() {
            return name;
        }

        public int getPrice() {
            return price;
        }

        @Override
        public String toString() {
            return name + " : " + price + "$";
        }
    }

    public static void main(String[] args) {
        List<Product> products = Arrays.asList(
            new Product("Laptop", 1500),
            new Product("Phone", 800),
            new Product("Tablet", 500),
            new Product("Monitor", 300)
        );

        System.out.println("원본 상품 리스트:");
        products.forEach(System.out::println);

        List<Product> sorted = products.stream()
            .sorted(Comparator.comparingInt(Product::getPrice))
            .collect(Collectors.toList());

        System.out.println("\\n가격 오름차순 정렬:");
        sorted.forEach(System.out::println);
    }
}`;

const MENU_ITEMS = [
  {
    id: "java",
    label: "자바 공부",
    description: "프로그래밍 교육 글",
    eyebrow: "Java Blog Assistant",
    title: "자바 공부",
    sourceTitle: "원본 입력",
    sourceHint: "[문제], [데이터], [요구사항], [소스] 형식으로 붙여 넣으세요.",
    placeholder: "Java 실습 문제, 데이터, 요구사항, 소스 코드를 입력하세요.",
    tones: [
      { value: "practice", label: "실습 중심" },
      { value: "friendly", label: "친절한 강의체" },
      { value: "short", label: "짧고 핵심적으로" },
    ],
  },
  {
    id: "it",
    label: "IT 이야기",
    description: "기술 트렌드 해설",
    eyebrow: "IT Trend Writer",
    title: "IT 이야기",
    sourceTitle: "블로그 주제",
    sourceHint: "추천 주제를 선택하거나 직접 쓰면 워드프레스용 블로그 글을 생성합니다.",
    placeholder: "예: 2026년 국내 클라우드 비용 최적화 흐름과 기업 대응 전략",
    searchQuery: "IT 기술 트렌드 클라우드 보안 디지털전환",
    tones: [
      { value: "trend", label: "트렌드 분석형" },
      { value: "insight", label: "인사이트 칼럼형" },
      { value: "beginner", label: "쉽게 풀어쓰기" },
    ],
  },
  {
    id: "programming",
    label: "개발 이야기",
    description: "개발 문화와 도구",
    eyebrow: "Programming Writer",
    title: "개발 이야기",
    sourceTitle: "블로그 주제",
    sourceHint: "최근 개발 이슈 중 하나를 선택하거나 직접 주제를 입력하세요.",
    placeholder: "예: AI 코딩 도구가 팀 코드리뷰 문화에 미치는 영향",
    searchQuery: "소프트웨어 개발 프로그래밍 개발자 도구 AI 코딩",
    tones: [
      { value: "developer", label: "개발자 관점" },
      { value: "practical", label: "실무 적용형" },
      { value: "essay", label: "개발 에세이형" },
    ],
  },
  {
    id: "sw-testing",
    label: "SW 테스팅",
    description: "품질과 테스트 전략",
    eyebrow: "SW Testing Writer",
    title: "SW 테스팅",
    sourceTitle: "블로그 주제",
    sourceHint: "테스트 자동화, QA, 품질 개선 관련 최신 주제를 선택하거나 직접 입력하세요.",
    placeholder: "예: 개발팀이 회귀 테스트 자동화를 도입할 때 먼저 정해야 할 기준",
    searchQuery: "소프트웨어 테스팅 QA 테스트 자동화 품질 보증 회귀 테스트",
    tones: [
      { value: "qa-practical", label: "QA 실무형" },
      { value: "testing-guide", label: "테스트 가이드형" },
      { value: "case-study", label: "사례 분석형" },
    ],
  },
  {
    id: "stock-beginner",
    label: "주식 초보",
    description: "투자 기초와 실전",
    eyebrow: "Stock Beginner Writer",
    title: "주식 초보",
    sourceTitle: "블로그 주제",
    sourceHint: "주식 기초, 시장 흐름, 초보 투자자가 알아야 할 주제를 선택하거나 직접 입력하세요.",
    placeholder: "예: 주식 초보가 실적 발표 시즌에 확인해야 할 기본 지표",
    searchQuery: "주식 초보 투자 기초 증시 시장 지표 포트폴리오",
    tones: [
      { value: "beginner-investing", label: "초보자 설명형" },
      { value: "risk-aware", label: "위험 관리형" },
      { value: "market-note", label: "시장 해설형" },
    ],
  },
  {
    id: "ai",
    label: "AI 이야기",
    description: "AI 뉴스와 활용",
    eyebrow: "AI Blog Writer",
    title: "AI 이야기",
    sourceTitle: "블로그 주제",
    sourceHint: "최신 AI 이슈를 선택하면 핵심 키워드 기반 블로그 글을 작성합니다.",
    placeholder: "예: 멀티모달 AI가 업무 자동화 도구 시장을 바꾸는 방식",
    searchQuery: "AI 인공지능 생성형AI 멀티모달 에이전트",
    tones: [
      { value: "explainer", label: "이슈 해설형" },
      { value: "business", label: "비즈니스 관점" },
      { value: "future", label: "미래 전망형" },
    ],
  },
  {
    id: "server",
    label: "서버 설정",
    description: "인프라와 운영",
    eyebrow: "Server Ops Writer",
    title: "서버 설정",
    sourceTitle: "블로그 주제",
    sourceHint: "서버 운영, 배포, 보안 관련 최신 주제를 선택하거나 직접 입력하세요.",
    placeholder: "예: 컨테이너 배포 환경에서 로그와 모니터링을 설계하는 방법",
    searchQuery: "서버 운영 인프라 Kubernetes Docker 보안 모니터링",
    tones: [
      { value: "ops-guide", label: "운영 가이드형" },
      { value: "checklist", label: "체크리스트형" },
      { value: "troubleshooting", label: "문제 해결형" },
    ],
  },
  {
    id: "environment",
    label: "환경 설정",
    description: "개발 환경과 생산성",
    eyebrow: "Environment Setup Writer",
    title: "환경 설정",
    sourceTitle: "블로그 주제",
    sourceHint: "개발 환경, 툴체인, 생산성 설정 관련 주제를 선택하거나 직접 입력하세요.",
    placeholder: "예: Windows 개발 환경에서 Node.js와 Docker를 안정적으로 구성하는 방법",
    searchQuery: "개발 환경 설정 IDE Node.js Docker Windows macOS 생산성",
    tones: [
      { value: "setup-guide", label: "설정 가이드형" },
      { value: "step-by-step", label: "따라하기형" },
      { value: "comparison", label: "비교 분석형" },
    ],
  },
  {
    id: "thumbnail",
    label: "썸네일 만들기",
    description: "워드프레스 대표 이미지",
    eyebrow: "Thumbnail Maker",
    title: "썸네일 만들기",
    sourceTitle: "블로그 제목",
    sourceHint: "블로그 제목과 로컬 배경 템플릿을 선택해 썸네일 이미지를 만듭니다.",
    placeholder: "예: Java Stream 객체 정렬 예제",
    searchQuery: "",
    tones: [],
  },
  {
    id: "existing-rewrite",
    label: "기존 블로그 수정",
    description: "SEO 통과용 재작성",
    eyebrow: "Existing Post SEO Editor",
    title: "기존 블로그 수정",
    sourceTitle: "기존 글 붙여넣기",
    sourceHint: "이미 블로그에 등록된 글을 그대로 붙여 넣으면 SEO 기준에 맞는 Markdown 글로 새롭게 재작성합니다.",
    placeholder: "기존 블로그 제목과 본문을 그대로 붙여 넣으세요. 예: 2026년 바이브코딩 트렌드와 AI Agent의 결합...",
    searchQuery: "",
    tones: [
      { value: "seo-rewrite", label: "SEO 재작성형" },
      { value: "practical-edit", label: "실무 가이드 보강형" },
      { value: "reader-friendly", label: "독자 친화형" },
    ],
  },
];

const sourceInput = document.querySelector("#sourceInput");
const markdownOutput = document.querySelector("#markdownOutput");
const toolList = document.querySelector("#toolList");
const blogEditorHeader = document.querySelector("#blogEditorHeader");
const blogInputGrid = document.querySelector("#blogInputGrid");
const editorEyebrow = document.querySelector("#editorEyebrow");
const editorTitle = document.querySelector("#editorTitle");
const sourcePanelTitle = document.querySelector("#sourcePanelTitle");
const sourcePanelHint = document.querySelector("#sourcePanelHint");
const topicPanel = document.querySelector("#topicPanel");
const topicPanelTitle = document.querySelector("#topicPanelTitle");
const topicStatus = document.querySelector("#topicStatus");
const topicSuggestions = document.querySelector("#topicSuggestions");
const refreshTopicsButton = document.querySelector("#refreshTopicsButton");
const topicSearchForm = document.querySelector("#topicSearchForm");
const topicSearchInput = document.querySelector("#topicSearchInput");
const providerSelect = document.querySelector("#providerSelect");
const openaiModelInput = document.querySelector("#openaiModelInput");
const ollamaModelInput = document.querySelector("#ollamaModelInput");
const keywordInput = document.querySelector("#keywordInput");
const toneSelect = document.querySelector("#toneSelect");
const fixCodeCheck = document.querySelector("#fixCodeCheck");
const seoAutoRefineCheck = document.querySelector("#seoAutoRefineCheck");
const sampleButton = document.querySelector("#sampleButton");
const clearSourceButton = document.querySelector("#clearSourceButton");
const generateButton = document.querySelector("#generateButton");
const copyButton = document.querySelector("#copyButton");
const downloadButton = document.querySelector("#downloadButton");
const seoReport = document.querySelector("#seoReport");
const generationStatus = document.querySelector("#generationStatus");
const toast = document.querySelector("#toast");
const thumbnailPanel = document.querySelector("#thumbnailPanel");
const thumbnailTitleInput = document.querySelector("#thumbnailTitleInput");
const thumbnailTemplateSelect = document.querySelector("#thumbnailTemplateSelect");
const thumbnailTemplateChoices = document.querySelector("#thumbnailTemplateChoices");
const coverCanvas = document.querySelector("#coverCanvas");
const coverStatus = document.querySelector("#coverStatus");
const generateCoverButton = document.querySelector("#generateCoverButton");
const downloadCoverButton = document.querySelector("#downloadCoverButton");
const autoWpImagesCheck = document.querySelector("#autoWpImagesCheck");
const generateWpImagesButton = document.querySelector("#generateWpImagesButton");
const downloadWpImagesButton = document.querySelector("#downloadWpImagesButton");
const copyWpMetadataButton = document.querySelector("#copyWpMetadataButton");
const publishDraftButton = document.querySelector("#publishDraftButton");
const wpImageStatus = document.querySelector("#wpImageStatus");
const wpImageResults = document.querySelector("#wpImageResults");
const wpPublishStatus = document.querySelector("#wpPublishStatus");
const outputArea = document.querySelector(".output-area");
const mediaPanel = document.querySelector(".media-panel");
const outputGrid = document.querySelector(".output-grid");
const outputTitle = document.querySelector(".output-toolbar h2");

let lastAutoKeywords = keywordInput.value.trim();
let generationTimer = null;
let generationStartedAt = 0;
let coverImageReady = false;
let wpImageResultsData = [];
let currentMenuId = "java";
let selectedTopic = null;
let activeTopicCacheKey = "";
let activeTopicQuery = "";
const topicCache = new Map();
const DEFAULT_THUMBNAIL_TITLE = "블로그 제목을 입력하세요";
const LOCAL_COVER_TEMPLATES = [
  { id: "tech-gray", label: "테크 그레이", pattern: "network" },
  { id: "emerald-circuit", label: "에메랄드 회로", pattern: "circuit" },
  { id: "indigo-data", label: "인디고 데이터", pattern: "matrix" },
  { id: "coral-flow", label: "코럴 플로우", pattern: "waves" },
  { id: "paper-grid", label: "페이퍼 그리드", pattern: "grid" },
  { id: "market-bars", label: "마켓 바 차트", pattern: "bars" },
];

function normalizeLineBreaks(value) {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function collapseBlankLines(value) {
  return normalizeLineBreaks(value)
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getCurrentMenu() {
  return MENU_ITEMS.find((item) => item.id === currentMenuId) || MENU_ITEMS[0];
}

function isJavaMode() {
  return currentMenuId === "java";
}

function isExistingRewriteMode() {
  return currentMenuId === "existing-rewrite";
}

function isThumbnailMode() {
  return currentMenuId === "thumbnail";
}

function getCoverTemplate(templateId = "") {
  return LOCAL_COVER_TEMPLATES.find((template) => template.id === templateId) || LOCAL_COVER_TEMPLATES[0];
}

function renderMenu() {
  if (!toolList) return;

  toolList.innerHTML = MENU_ITEMS
    .map((item) => `
      <button class="tool-item${item.id === currentMenuId ? " is-active" : ""}" type="button" data-menu-id="${item.id}">
        <span>${escapeHtml(item.label)}</span>
        <small>${escapeHtml(item.description)}</small>
      </button>
    `)
    .join("");
}

function setToneOptions(menu) {
  toneSelect.innerHTML = (menu.tones || [])
    .map((tone, index) => `<option value="${escapeHtml(tone.value)}"${index === 0 ? " selected" : ""}>${escapeHtml(tone.label)}</option>`)
    .join("");
}

function renderThumbnailTemplates() {
  if (thumbnailTemplateSelect) {
    thumbnailTemplateSelect.innerHTML = LOCAL_COVER_TEMPLATES
      .map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.label)}</option>`)
      .join("");
  }

  if (thumbnailTemplateChoices) {
    thumbnailTemplateChoices.innerHTML = LOCAL_COVER_TEMPLATES
      .map((template) => `
        <button class="thumbnail-template-choice" type="button" data-template-id="${escapeHtml(template.id)}">
          <span class="template-swatch" aria-hidden="true"></span>
          <span>${escapeHtml(template.label)}</span>
        </button>
      `)
      .join("");
  }

  updateThumbnailTemplateSelection();
}

function updateThumbnailTemplateSelection() {
  const selectedId = thumbnailTemplateSelect?.value || LOCAL_COVER_TEMPLATES[0].id;

  thumbnailTemplateChoices?.querySelectorAll("[data-template-id]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.templateId === selectedId);
  });
}

function applyMenu(menuId, { reset = true } = {}) {
  const nextMenu = MENU_ITEMS.find((item) => item.id === menuId) || MENU_ITEMS[0];
  currentMenuId = nextMenu.id;
  selectedTopic = null;
  const thumbnailMode = isThumbnailMode();

  renderMenu();
  setToneOptions(nextMenu);

  if (blogEditorHeader) blogEditorHeader.hidden = thumbnailMode;
  if (blogInputGrid) blogInputGrid.hidden = thumbnailMode;
  if (thumbnailPanel) thumbnailPanel.hidden = !thumbnailMode;
  if (outputArea) outputArea.hidden = thumbnailMode;

  if (thumbnailMode) {
    topicPanel.hidden = true;
    if (reset) {
      clearOutputArea();
      setCoverStatus("블로그 제목과 배경 템플릿을 선택한 뒤 썸네일을 생성하세요.");
    }
    thumbnailTitleInput?.focus();
    return;
  }

  editorEyebrow.textContent = nextMenu.eyebrow;
  editorTitle.textContent = nextMenu.title;
  sourcePanelTitle.textContent = nextMenu.sourceTitle;
  sourcePanelHint.textContent = nextMenu.sourceHint;
  sourceInput.placeholder = nextMenu.placeholder;
  sampleButton.hidden = !isJavaMode();
  fixCodeCheck.closest(".check-field").hidden = !isJavaMode();
  topicPanel.hidden = isJavaMode() || isExistingRewriteMode();
  topicPanelTitle.textContent = `${nextMenu.label} 최근 이슈 주제`;
  syncExistingRewriteUi();

  if (reset) {
    sourceInput.value = "";
    clearOutputArea();
    keywordInput.value = "";
    lastAutoKeywords = "";
    if (topicSearchInput) topicSearchInput.value = "";
  }

  if (!isJavaMode() && !isExistingRewriteMode()) {
    loadTrendingTopics(nextMenu.id);
  } else {
    topicSuggestions.innerHTML = "";
    topicStatus.textContent = "";
  }
}

function extractGenericKeywords(value, limit = 7) {
  const stopWords = new Set(["그리고", "하지만", "있는", "없는", "대한", "관련", "최근", "이슈", "주제", "블로그", "작성", "위한", "the", "and", "for", "with"]);
  const words = String(value || "")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !stopWords.has(word.toLowerCase()));

  return [...new Set(words)].slice(0, limit).join(", ");
}

function syncExistingRewriteUi() {
  const existingMode = isExistingRewriteMode();

  [generateWpImagesButton, downloadWpImagesButton, copyWpMetadataButton].forEach((button) => {
    if (button) button.hidden = existingMode;
  });

  if (mediaPanel) mediaPanel.hidden = existingMode;
  if (outputGrid) outputGrid.classList.toggle("is-text-only", existingMode);
  if (outputTitle) outputTitle.textContent = existingMode ? "수정된 Markdown 글" : "글, 이미지, 메타데이터";
  if (publishDraftButton) publishDraftButton.textContent = existingMode ? "수정글 발행" : "WP 임시글 발행";
  if (copyButton) copyButton.textContent = existingMode ? "생성글 복사" : "Markdown 복사";
}

function extractExistingPostKeywords(value) {
  const text = String(value || "");
  const phraseCandidates = [
    "바이브코딩",
    "AI Agent",
    "AI 에이전트",
    "Agent-of-Agents",
    "퍼스널 AI Agent",
    "워드프레스 SEO",
    "블로그 SEO",
  ].filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
  const genericKeywords = extractGenericKeywords(text, 12)
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword && !/^\d{4}년?$/.test(keyword));

  return [...new Set([...phraseCandidates, ...genericKeywords])].slice(0, 7).join(", ");
}

function setTopicStatus(message) {
  if (topicStatus) topicStatus.textContent = message || "";
}

function getTopicCacheKey(menuId, query) {
  return `${menuId}:${String(query || "").trim().toLowerCase()}`;
}

function setTopicSearchLoading(isLoading) {
  refreshTopicsButton.disabled = isLoading;
  const searchButton = topicSearchForm?.querySelector("button");
  if (searchButton) searchButton.disabled = isLoading;
}

async function loadTrendingTopics(menuId = currentMenuId, { force = false, query = "" } = {}) {
  const menu = MENU_ITEMS.find((item) => item.id === menuId) || getCurrentMenu();
  if (menu.id === "java") return;
  const requestedQuery = String(query || menu.searchQuery || menu.label).trim();
  const cacheKey = getTopicCacheKey(menu.id, requestedQuery);
  activeTopicCacheKey = cacheKey;
  activeTopicQuery = requestedQuery;

  if (!force && topicCache.has(cacheKey)) {
    renderTopicSuggestions(topicCache.get(cacheKey));
    return;
  }

  setTopicSearchLoading(true);
  topicSuggestions.innerHTML = "";
  setTopicStatus(`"${requestedQuery}" 관련 정보를 검색해 카드 주제를 만드는 중입니다...`);

  try {
    const url = `/api/trending-topics?category=${encodeURIComponent(menu.id)}&q=${encodeURIComponent(requestedQuery)}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `주제 검색 실패: HTTP ${response.status}`);

    topicCache.set(cacheKey, data.topics || []);
    renderTopicSuggestions(data.topics || []);
    setTopicStatus(`"${requestedQuery}" 관련 주제 ${data.topics?.length || 0}개를 불러왔습니다.`);
  } catch (error) {
    renderTopicSuggestions([]);
    setTopicStatus(error.message || "최신 주제를 불러오지 못했습니다.");
  } finally {
    setTopicSearchLoading(false);
  }
}

function renderTopicSuggestions(topics) {
  if (!topicSuggestions) return;

  if (!topics.length) {
    topicSuggestions.innerHTML = `<p class="empty-state">추천 주제가 없습니다. 직접 주제를 입력해 주세요.</p>`;
    return;
  }

  topicSuggestions.innerHTML = topics
    .slice(0, 5)
    .map((topic, index) => `
      <button class="topic-card" type="button" data-topic-index="${index}">
        <strong>${escapeHtml(topic.title)}</strong>
        <span>${escapeHtml((topic.keywords || []).join(", "))}</span>
        <small>${escapeHtml(topic.source || "뉴스 검색")} · ${escapeHtml(topic.published || "")}</small>
      </button>
    `)
    .join("");
}

function selectSuggestedTopic(index) {
  const topics = topicCache.get(activeTopicCacheKey) || [];
  const topic = topics[index];
  if (!topic) return;

  selectedTopic = topic;
  sourceInput.value = [
    `[주제] ${topic.title}`,
    topic.summary ? `[핵심 맥락] ${topic.summary}` : "",
    topic.source ? `[출처] ${topic.source}` : "",
    topic.link ? `[참고 링크] ${topic.link}` : "",
  ].filter(Boolean).join("\n");
  keywordInput.value = (topic.keywords || []).join(", ");
  lastAutoKeywords = keywordInput.value.trim();
  clearOutputArea();
  sourceInput.focus();
  showToast("선택한 주제를 입력 영역에 반영했습니다. 글 생성 버튼을 눌러 주세요.");
}

function parseSections(rawValue) {
  const raw = normalizeLineBreaks(rawValue);
  const titleMatch = raw.match(/^([^\n\[]+)/);
  const sections = {
    title: titleMatch ? titleMatch[1].trim() : "Java 예제",
    problem: "",
    data: "",
    requirements: "",
    source: "",
  };
  const sectionRegex = /^\s*\[([^\]\n]+)\]\s*$/gm;
  const matches = [...raw.matchAll(sectionRegex)];

  matches.forEach((match, index) => {
    const name = match[1].replace(/\s+/g, "");
    const start = match.index + match[0].length;
    const end = matches[index + 1] ? matches[index + 1].index : raw.length;
    const content = raw.slice(start, end).trim();

    if (name.includes("문제")) sections.problem = content;
    else if (name.includes("데이터") || /^data$/i.test(name)) sections.data = content;
    else if (name.includes("요구") || /requirements?/i.test(name)) sections.requirements = content;
    else if (name.includes("소스") || /source|code/i.test(name)) sections.source = content;
  });

  return sections;
}

function tidyJavaCode(code) {
  if (!code) return "";

  return normalizeLineBreaks(code)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "")
    .join("\n")
    .replace(/(import [^\n]+;\n)(public class)/, "$1\n$2")
    .replace(/(;|\})\n(    static class)/, "$1\n\n$2")
    .replace(/(\})\n(    public static void main)/, "$1\n\n$2")
    .trim();
}

function getClassName(code) {
  return code.match(/\bclass\s+([A-Za-z_$][\w$]*)/)?.[1] || "JavaExample";
}

function getConcepts(text, code, keywords) {
  const source = `${text}\n${code}\n${keywords}`.toLowerCase();
  const concepts = [];

  if (source.includes("stream")) concepts.push("Java Stream");
  if (source.includes("sorted")) concepts.push("sorted()");
  if (source.includes("comparator")) concepts.push("Comparator");
  if (source.includes("comparingint")) concepts.push("Comparator.comparingInt()");
  if (source.includes("list<") || source.includes("arrays.aslist") || source.includes("객체")) concepts.push("객체 리스트 정렬");
  if (source.includes("price") || source.includes("오름차순")) concepts.push("오름차순 정렬");

  return [...new Set(concepts)];
}

function extractCoreKeywords(raw) {
  const sections = parseSections(raw);
  const code = tidyJavaCode(sections.source);
  const source = `${raw}\n${code}`.toLowerCase();
  const keywords = [];
  const addKeyword = (keyword) => {
    if (keyword && !keywords.includes(keyword)) keywords.push(keyword);
  };

  addKeyword("Java");
  if (source.includes("stream")) addKeyword("Java Stream");
  if (source.includes("sorted")) addKeyword("sorted()");
  if (source.includes("comparator")) addKeyword("Comparator");
  if (source.includes("comparingint")) addKeyword("Comparator.comparingInt()");
  if (source.includes("collectors.tolist")) addKeyword("Collectors.toList()");
  if (source.includes("list<") || source.includes("arrays.aslist") || source.includes("new product(")) addKeyword("객체 리스트");
  if (source.includes("sorted") && (source.includes("product") || source.includes("class "))) addKeyword("객체 리스트 정렬");
  if (source.includes("comparingint") || source.includes("price")) addKeyword("오름차순 정렬");

  return keywords.slice(0, 7).join(", ");
}

function syncKeywordsFromSource(raw, { force = false } = {}) {
  const generatedKeywords = extractCoreKeywords(raw);
  const currentKeywords = keywordInput.value.trim();

  if (!generatedKeywords) return currentKeywords;
  if (force || !currentKeywords || currentKeywords === lastAutoKeywords) {
    keywordInput.value = generatedKeywords;
    lastAutoKeywords = generatedKeywords;
    return generatedKeywords;
  }

  return currentKeywords;
}

function stripWordPressImagePrompt(markdown) {
  return String(markdown || "")
    .replace(/\n{0,2}##[^\n]*(?:대표\s*이미지\s*프롬프트|image\s*prompt)[^\n]*[\s\S]*?(?=\n##\s+|$)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function setCoverStatus(message) {
  if (coverStatus) coverStatus.textContent = message || "";
}

function clearCoverImage() {
  if (!coverCanvas) return;

  const ctx = coverCanvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, coverCanvas.width, coverCanvas.height);
  }

  coverImageReady = false;
  if (downloadCoverButton) downloadCoverButton.disabled = true;
  setCoverStatus("");
}

function extractCoverTitle() {
  if (isThumbnailMode()) {
    return thumbnailTitleInput?.value.trim() || "";
  }

  const markdownTitle = markdownOutput.value.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (markdownTitle) return markdownTitle;

  const sourceTitle = parseSections(sourceInput.value).title;
  return sourceTitle || "Java Blog";
}

function hashString(value) {
  let hash = 2166136261;

  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed || 1;

  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function drawHexagon(ctx, x, y, radius, stroke, fill) {
  ctx.beginPath();

  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 6 + (Math.PI * 2 * index) / 6;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;

    if (index === 0) ctx.moveTo(pointX, pointY);
    else ctx.lineTo(pointX, pointY);
  }

  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawSoftGrid(ctx, width, height, color = "rgba(255,255,255,0.16)") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += 70) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawCircuitPattern(ctx, width, height, random) {
  ctx.strokeStyle = "rgba(205, 255, 233, 0.34)";
  ctx.lineWidth = 3;

  for (let row = 0; row < 6; row += 1) {
    const y = 72 + row * 92;
    let x = 40 + random() * 80;
    ctx.beginPath();
    ctx.moveTo(x, y);

    while (x < width - 80) {
      x += 80 + random() * 85;
      const nextY = y + (random() > 0.5 ? 28 : -28);
      ctx.lineTo(x, y);
      ctx.lineTo(x, nextY);
    }

    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.42)";
  for (let index = 0; index < 34; index += 1) {
    ctx.beginPath();
    ctx.arc(random() * width, random() * height, 4 + random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMatrixPattern(ctx, width, height, random) {
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.font = '700 24px "Segoe UI", sans-serif';
  const marks = ["01", "AI", "{}", "<>", "fn", "db"];

  for (let index = 0; index < 120; index += 1) {
    ctx.globalAlpha = 0.08 + random() * 0.22;
    ctx.fillText(marks[index % marks.length], random() * width, random() * height);
  }

  ctx.globalAlpha = 1;
}

function drawWavePattern(ctx, width, height) {
  for (let band = 0; band < 7; band += 1) {
    ctx.beginPath();
    const y = 80 + band * 78;
    ctx.moveTo(0, y);

    for (let x = 0; x <= width; x += 36) {
      const waveY = y + Math.sin(x / 80 + band * 0.7) * 28;
      ctx.lineTo(x, waveY);
    }

    ctx.strokeStyle = `rgba(255,255,255,${0.1 + band * 0.025})`;
    ctx.lineWidth = 10 - band * 0.7;
    ctx.stroke();
  }
}

function drawBarPattern(ctx, width, height, random) {
  const baseY = height - 74;
  const barWidth = 34;

  for (let index = 0; index < 24; index += 1) {
    const x = 42 + index * 48;
    const barHeight = 80 + random() * 270;
    const hue = index % 2 === 0 ? "rgba(255,255,255,0.34)" : "rgba(145, 214, 190, 0.42)";
    ctx.fillStyle = hue;
    ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(38, baseY - 30);
  for (let index = 0; index < 24; index += 1) {
    ctx.lineTo(59 + index * 48, baseY - 110 - random() * 210);
  }
  ctx.stroke();
}

function drawNetworkPattern(ctx, width, height) {
  const nodes = [
    [145, 165, 44],
    [285, 105, 34],
    [485, 145, 48],
    [705, 100, 42],
    [920, 150, 46],
    [1045, 250, 34],
    [215, 380, 48],
    [425, 455, 32],
    [700, 435, 45],
    [930, 365, 36],
    [1030, 475, 30],
  ];

  ctx.strokeStyle = "rgba(39, 69, 72, 0.32)";
  ctx.lineWidth = 3;
  nodes.forEach((node, index) => {
    const next = nodes[(index + 1) % nodes.length];
    if (index % 3 !== 2) {
      ctx.beginPath();
      ctx.moveTo(node[0], node[1]);
      ctx.lineTo(next[0], next[1]);
      ctx.stroke();
    }
  });

  nodes.forEach(([x, y, radius], index) => {
    drawHexagon(ctx, x, y, radius, "rgba(255,255,255,0.28)", "rgba(29, 70, 76, 0.48)");
    ctx.fillStyle = "rgba(255,255,255,0.54)";
    ctx.font = `700 ${Math.max(18, Math.round(radius * 0.48))}px "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(["{}", "<>", "01", "AI"][index % 4], x, y);
  });
}

function drawLocalCoverBackground(ctx, title, templateId = "") {
  const width = coverCanvas.width;
  const height = coverCanvas.height;
  const seed = hashString(title);
  const random = createRandom(seed);
  const template = getCoverTemplate(templateId);
  const gradient = ctx.createLinearGradient(0, 0, width, height);

  const gradients = {
    "tech-gray": ["#8e9694", "#a2a19d", "#8d8b86"],
    "emerald-circuit": ["#0f5f54", "#1e8f75", "#1c3638"],
    "indigo-data": ["#26365f", "#5a4f9c", "#19212f"],
    "coral-flow": ["#b84f42", "#e4a15b", "#516d70"],
    "paper-grid": ["#e9edf0", "#f7f3e8", "#cad8d1"],
    "market-bars": ["#213a43", "#3e6b63", "#9c6a3b"],
  };
  const colors = gradients[template.id] || gradients["tech-gray"];

  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#ffffff";
  for (let index = 0; index < 42; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const radius = 1 + random() * 2.2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (template.pattern === "network") drawNetworkPattern(ctx, width, height);
  else if (template.pattern === "circuit") drawCircuitPattern(ctx, width, height, random);
  else if (template.pattern === "matrix") drawMatrixPattern(ctx, width, height, random);
  else if (template.pattern === "waves") drawWavePattern(ctx, width, height);
  else if (template.pattern === "grid") drawSoftGrid(ctx, width, height, "rgba(31, 65, 69, 0.16)");
  else if (template.pattern === "bars") drawBarPattern(ctx, width, height, random);

  const vignette = ctx.createRadialGradient(width / 2, height / 2, 120, width / 2, height / 2, 620);
  vignette.addColorStop(0, template.id === "paper-grid" ? "rgba(255, 255, 255, 0.04)" : "rgba(80, 82, 80, 0.1)");
  vignette.addColorStop(1, template.id === "paper-grid" ? "rgba(42, 55, 56, 0.24)" : "rgba(45, 46, 44, 0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawCoverImageElement(ctx, image) {
  const width = coverCanvas.width;
  const height = coverCanvas.height;
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  ctx.drawImage(image, x, y, drawWidth, drawHeight);
  ctx.fillStyle = "rgba(70, 72, 70, 0.44)";
  ctx.fillRect(0, 0, width, height);
}

function splitLongToken(token, ctx, maxWidth) {
  const chunks = [];
  let current = "";

  for (const char of token) {
    const next = current + char;

    if (current && ctx.measureText(next).width > maxWidth) {
      chunks.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function wrapCanvasText(ctx, text, maxWidth, maxLines) {
  const words = String(text || DEFAULT_THUMBNAIL_TITLE).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidates = ctx.measureText(word).width > maxWidth
      ? splitLongToken(word, ctx, maxWidth)
      : [word];

    candidates.forEach((candidate) => {
      const next = line ? `${line} ${candidate}` : candidate;

      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = candidate;
      } else {
        line = next;
      }
    });
  });

  if (line) lines.push(line);

  if (lines.length <= maxLines) return lines;

  const clipped = lines.slice(0, maxLines);
  while (ctx.measureText(`${clipped[maxLines - 1]}...`).width > maxWidth && clipped[maxLines - 1].length > 1) {
    clipped[maxLines - 1] = clipped[maxLines - 1].slice(0, -1);
  }
  clipped[maxLines - 1] = `${clipped[maxLines - 1]}...`;

  return clipped;
}

let koreanFontLoadPromise = null;

function ensureKoreanFontLoaded() {
  if (!koreanFontLoadPromise) {
    koreanFontLoadPromise = (async () => {
      if (!("fonts" in document)) return;
      try {
        await Promise.all([
          document.fonts.load('800 82px "Noto Sans KR"'),
          document.fonts.load('800 68px "Noto Sans KR"'),
        ]);
        await document.fonts.ready;
      } catch (error) {
        // Noto Sans KR failed to load; canvas falls back to a system Korean font.
      }
    })();
  }
  return koreanFontLoadPromise;
}

function drawCoverTitle(ctx, title) {
  const width = coverCanvas.width;
  const height = coverCanvas.height;
  let fontSize = title.length > 36 ? 58 : 68;
  let lines = [];

  do {
    ctx.font = `800 ${fontSize}px "Noto Sans KR", "Segoe UI", sans-serif`;
    lines = wrapCanvasText(ctx, title, width * 0.76, 3);
    fontSize -= 4;
  } while (lines.length > 2 && fontSize > 48);

  const lineHeight = Math.round((fontSize + 4) * 1.22);
  const totalHeight = lineHeight * lines.length;
  const startY = Math.round((height - totalHeight) / 2 + lineHeight / 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.56)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(33, 35, 34, 0.58)";
  ctx.lineWidth = 7;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    ctx.strokeText(line, width / 2, y);
    ctx.fillText(line, width / 2, y);
  });

  ctx.shadowColor = "transparent";
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = src;
  });
}

async function generateCoverImage() {
  if (!coverCanvas) return;

  const title = extractCoverTitle();
  if (!title) {
    showToast("썸네일에 넣을 블로그 제목을 입력해 주세요.");
    thumbnailTitleInput?.focus();
    return;
  }

  const ctx = coverCanvas.getContext("2d");
  const template = getCoverTemplate(thumbnailTemplateSelect?.value);

  generateCoverButton.disabled = true;
  downloadCoverButton.disabled = true;
  coverImageReady = false;
  setCoverStatus("무료 로컬 템플릿으로 썸네일을 생성하는 중입니다...");

  try {
    await ensureKoreanFontLoaded();
    drawLocalCoverBackground(ctx, title, template.id);
    drawCoverTitle(ctx, title);
    coverImageReady = true;
    downloadCoverButton.disabled = false;
    setCoverStatus(`${template.label} 템플릿으로 워드프레스용 썸네일을 만들었습니다.`);
  } catch (error) {
    drawLocalCoverBackground(ctx, title, LOCAL_COVER_TEMPLATES[0].id);
    drawCoverTitle(ctx, title);
    coverImageReady = true;
    downloadCoverButton.disabled = false;
    setCoverStatus(`${error.message || "썸네일 생성에 실패했습니다."} 기본 로컬 템플릿으로 대체했습니다.`);
  } finally {
    generateCoverButton.disabled = false;
  }
}

function downloadCoverImage() {
  if (!coverImageReady) {
    showToast("먼저 썸네일을 생성해 주세요.");
    return;
  }

  const link = document.createElement("a");
  const titleSlug = extractCoverTitle()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "blog-thumbnail";

  link.href = coverCanvas.toDataURL("image/png");
  link.download = `${titleSlug}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("썸네일 PNG 다운로드를 시작했습니다.");
}

function setWpImageStatus(message, type = "") {
  if (!wpImageStatus) return;

  wpImageStatus.textContent = message || "";
  wpImageStatus.classList.toggle("is-error", type === "error" && Boolean(message));
}

function normalizeWpImageError(error) {
  const rawMessage = String(error?.message || error || "").trim();
  let message = rawMessage;

  try {
    const parsed = JSON.parse(rawMessage);
    message = parsed?.error?.message || parsed?.message || rawMessage;
  } catch {
    const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        message = parsed?.error?.message || parsed?.message || rawMessage;
      } catch {
        message = rawMessage;
      }
    }
  }

  if (/API_KEY_INVALID|API key not valid|INVALID_ARGUMENT/i.test(`${rawMessage} ${message}`)) {
    return "Gemini API 키가 유효하지 않습니다. .env의 GEMINI_API_KEY 또는 API_KEY 값을 새 키로 교체한 뒤 서버를 다시 시작해 주세요.";
  }

  if (/GEMINI_API_KEY|API_KEY/i.test(message) && /설정|not set|missing/i.test(message)) {
    return "Gemini API 키가 설정되어 있지 않습니다. .env 파일에 GEMINI_API_KEY=발급받은_키 형식으로 추가해 주세요.";
  }

  return message || "WordPress 이미지 생성 중 오류가 발생했습니다.";
}

function getWpImageTypeLabel(type) {
  if (type === "featured") return "대표 이미지";
  if (type === "content") return "본문 이미지 1";
  return "본문 이미지 2";
}

function getWpImageFilename(type) {
  if (type === "featured") return "wp-featured.webp";
  if (type === "content") return "wp-content-1.webp";
  return "wp-content-2.webp";
}

function extractWpImageTitle() {
  const markdownTitle = markdownOutput.value.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (markdownTitle) return markdownTitle;

  return extractCoverTitle();
}

function extractWpImageContent() {
  const markdown = markdownOutput.value.trim();
  const source = markdown || sourceInput.value.trim();

  return source
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

function drawWpImageTitle(ctx, title, width, height) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.fillRect(0, 0, width, height);

  let fontSize = title.length > 36 ? 68 : 82;
  let lines = [];
  const maxWidth = width * 0.78;

  do {
    ctx.font = `800 ${fontSize}px "Noto Sans KR", "Segoe UI", sans-serif`;
    lines = wrapCanvasText(ctx, title, maxWidth, 3);
    fontSize -= 4;
  } while (lines.length > 2 && fontSize > 48);

  const lineHeight = Math.round((fontSize + 4) * 1.24);
  const totalHeight = lineHeight * lines.length;
  const startY = Math.round((height - totalHeight) / 2 + lineHeight / 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.76)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#ffffff";

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });

  ctx.shadowColor = "transparent";
}

async function processWordPressImage(imageDataUrl, targetWidth, targetHeight, overlayTitle) {
  const image = await loadImage(imageDataUrl);
  const finalHeight = targetHeight || Math.round(targetWidth / (image.width / image.height));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("이미지 처리를 위한 캔버스를 만들지 못했습니다.");

  canvas.width = targetWidth;
  canvas.height = finalHeight;

  const imageAspect = image.width / image.height;
  const canvasAspect = targetWidth / finalHeight;

  if (imageAspect > canvasAspect + 0.01) {
    const sourceWidth = image.height * canvasAspect;
    const offsetX = (image.width - sourceWidth) / 2;
    ctx.drawImage(image, offsetX, 0, sourceWidth, image.height, 0, 0, targetWidth, finalHeight);
  } else if (imageAspect < canvasAspect - 0.01) {
    const sourceHeight = image.width / canvasAspect;
    const offsetY = (image.height - sourceHeight) / 2;
    ctx.drawImage(image, 0, offsetY, image.width, sourceHeight, 0, 0, targetWidth, finalHeight);
  } else {
    ctx.drawImage(image, 0, 0, targetWidth, finalHeight);
  }

  if (overlayTitle) {
    drawWpImageTitle(ctx, overlayTitle, targetWidth, finalHeight);
  }

  let quality = 0.9;
  let dataUrl = canvas.toDataURL("image/webp", quality);
  let sizeKb = Math.round((dataUrl.length * 0.75) / 1024);

  while (sizeKb > 300 && quality > 0.12) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/webp", quality);
    sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
  }

  return { url: dataUrl, sizeKb, width: targetWidth, height: finalHeight };
}

async function generateWordPressImages() {
  if (isExistingRewriteMode()) return;

  const title = extractWpImageTitle();
  const content = extractWpImageContent();

  if (!title || !content) {
    showToast("먼저 글을 생성하거나 원본 입력을 작성해 주세요.");
    return;
  }

  generateWpImagesButton.disabled = true;
  wpImageResultsData = [];
  renderWpImageResults();
  setWpImageStatus("메타데이터와 이미지 프롬프트를 생성 중입니다...");

  try {
    const response = await fetch("/api/wp-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, categoryLabel: getCurrentMenu().label }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `WordPress 이미지 생성 실패: HTTP ${response.status}`);

    await ensureKoreanFontLoaded();

    const processed = [];
    for (const image of data.images || []) {
      setWpImageStatus(`${getWpImageTypeLabel(image.type)} WebP 최적화 중입니다...`);
      const optimized = await processWordPressImage(
        image.imageDataUrl,
        image.targetWidth || 1024,
        image.targetHeight || null,
        image.overlayTitle || ""
      );

      processed.push({
        type: image.type,
        metadata: image.metadata,
        ...optimized,
      });
    }

    wpImageResultsData = processed;
    renderWpImageResults();
    refreshSeoReport();
    setWpImageStatus(`WordPress 이미지 ${processed.length}개를 생성했습니다.`);
    showToast("WordPress 이미지와 메타데이터를 생성했습니다.");
  } catch (error) {
    const friendlyError = normalizeWpImageError(error);
    setWpImageStatus(friendlyError, "error");
    showToast(friendlyError);
  } finally {
    generateWpImagesButton.disabled = false;
  }
}

function renderWpImageResults() {
  if (!wpImageResults) return;

  const hasResults = wpImageResultsData.length > 0;
  if (downloadWpImagesButton) downloadWpImagesButton.disabled = !hasResults;
  if (copyWpMetadataButton) copyWpMetadataButton.disabled = !hasResults;

  if (!wpImageResultsData.length) {
    wpImageResults.innerHTML = "";
    return;
  }

  wpImageResults.innerHTML = wpImageResultsData
    .map((result, index) => {
      const metadata = result.metadata || {};
      const sizeClass = result.sizeKb <= 300 ? "is-good" : "is-large";

      return `
        <article class="wp-image-card">
          <div class="wp-image-preview">
            <img src="${result.url}" alt="${escapeHtml(metadata.altText || getWpImageTypeLabel(result.type))}" />
            <div class="wp-image-badges">
              <span>${getWpImageTypeLabel(result.type)}</span>
              <span>${result.width} x ${result.height}</span>
              <span class="${sizeClass}">${result.sizeKb} KB</span>
            </div>
            <button class="secondary-button" type="button" data-wp-action="download" data-index="${index}">WebP 다운로드</button>
          </div>
          <div class="wp-metadata">
            <div class="wp-metadata-header">
              <h4>워드프레스 메타데이터</h4>
              <button class="small-copy-button" type="button" data-wp-action="copy-all" data-index="${index}">전체 복사</button>
            </div>
            ${renderWpMetadataField("대체 텍스트", metadata.altText, index, "altText")}
            ${renderWpMetadataField("제목", metadata.title, index, "title")}
            ${renderWpMetadataField("캡션", metadata.caption, index, "caption")}
            ${renderWpMetadataField("설명", metadata.description, index, "description")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWpMetadataField(label, value, index, key) {
  return `
    <div class="wp-metadata-field">
      <div>
        <strong>${label}</strong>
        <button class="small-copy-button" type="button" data-wp-action="copy-field" data-index="${index}" data-key="${key}">복사</button>
      </div>
      <p>${escapeHtml(value || "")}</p>
    </div>
  `;
}

function downloadWordPressImage(index) {
  const result = wpImageResultsData[index];
  if (!result) return;

  const link = document.createElement("a");
  link.href = result.url;
  link.download = getWpImageFilename(result.type);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadAllWordPressImages() {
  if (!wpImageResultsData.length) {
    showToast("다운로드할 WP 이미지가 없습니다.");
    return;
  }

  wpImageResultsData.forEach((_, index) => {
    window.setTimeout(() => downloadWordPressImage(index), index * 250);
  });
  showToast("WP 이미지 다운로드를 시작했습니다.");
}

function formatWpMetadata(metadata) {
  return `[대체 텍스트]
${metadata.altText || ""}

[제목]
${metadata.title || ""}

[캡션]
${metadata.caption || ""}

[설명]
${metadata.description || ""}`;
}

function getWpImageTypeLabel(type) {
  if (type === "featured") return "대표 이미지";
  if (type === "content") return "본문 이미지 1";
  return "본문 이미지 2";
}

function formatAllWpMetadata() {
  return wpImageResultsData
    .map((result) => `${getWpImageTypeLabel(result.type)}\n\n${formatWpMetadata(result.metadata || {})}`)
    .join("\n\n---\n\n");
}

function formatWpMetadata(metadata) {
  return `[대체 텍스트]
${metadata.altText || ""}

[제목]
${metadata.title || ""}

[캡션]
${metadata.caption || ""}

[설명]
${metadata.description || ""}`;
}

function refreshSeoReport() {
  if (!markdownOutput.value.trim()) return;
  renderSeoReport(auditSeoMarkdown(markdownOutput.value, keywordInput.value.trim()));
}

function getMarkdownTitle(markdown) {
  return String(markdown || "").match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
}

function getActiveKeywords() {
  const directKeywords = keywordInput.value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  if (directKeywords.length) return directKeywords;

  return extractGenericKeywords(`${sourceInput.value}\n${markdownOutput.value}`, 7)
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function slugifyPostTitle(title, keywords = []) {
  const base = keywords.length ? keywords.slice(0, 4).join(" ") : title;
  return String(base || "blog-post")
    .toLowerCase()
    .replace(/[`"'’“”()[\]{}]/g, "")
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "blog-post";
}

function stripMarkdownForDescription(markdown) {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, (match) => match.match(/\[([^\]]+)]/)?.[1] || " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMetaDescription(markdown, keywords = []) {
  const primaryKeyword = keywords[0] || getCurrentMenu().label;
  const text = stripMarkdownForDescription(markdown);
  const sentences = text.split(/(?<=[.!?。]|다\.|요\.)\s+/).filter(Boolean);
  let summary = "";

  for (const sentence of sentences) {
    if (summary.length >= 120) break;
    summary = `${summary} ${sentence}`.trim();
  }

  const seed = summary.includes(primaryKeyword)
    ? summary
    : `${primaryKeyword}를 중심으로 ${summary}`;

  return seed.replace(/\s+/g, " ").trim().slice(0, 155);
}

function getImageResult(type) {
  return wpImageResultsData.find((result) => result.type === type) || null;
}

function setWpPublishStatus(message, type = "") {
  if (!wpPublishStatus) return;

  wpPublishStatus.textContent = message || "";
  wpPublishStatus.classList.toggle("is-error", type === "error" && Boolean(message));
  wpPublishStatus.classList.toggle("is-success", type === "success" && Boolean(message));
}

function buildWpDraftPayload() {
  const markdown = markdownOutput.value.trim();
  if (!markdown) return null;

  const title = getMarkdownTitle(markdown) || extractCoverTitle();
  const keywords = getActiveKeywords();
  const slug = slugifyPostTitle(title, keywords);
  const metaDescription = buildMetaDescription(markdown, keywords);
  const category = getCurrentMenu().label;
  const tags = keywords.slice(0, 8);
  const focusKeyword = keywords[0] || (isJavaMode() ? "Java" : category);
  const seoTitle = title.length <= 65 ? title : title.slice(0, 62).trimEnd() + "...";

  return {
    title,
    originalTitle: isExistingRewriteMode() ? getExistingPostTitle(sourceInput.value) : "",
    seoTitle,
    focusKeyword,
    slug,
    category,
    tags,
    metaDescription,
    markdown: stripWordPressImagePrompt(markdown),
    images: isExistingRewriteMode() ? [] : wpImageResultsData.map((result) => ({
      type: result.type,
      filename: getWpImageFilename(result.type),
      dataUrl: result.url,
      metadata: result.metadata || {},
    })),
  };
}

async function publishExistingPostUpdate(payload) {
  publishDraftButton.disabled = true;
  setWpPublishStatus("동일 제목의 기존 WordPress 글을 찾고 수정하는 중입니다...");

  try {
    const response = await fetch("/api/wp-existing-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `WordPress 수정글 발행 실패: HTTP ${response.status}`);

    const linkText = data.link ? ` 보기: ${data.link}` : "";
    const warningText = Array.isArray(data.warnings) && data.warnings.length
      ? ` / 참고: ${data.warnings.join(" ")}`
      : "";
    setWpPublishStatus(`수정글 발행 완료: #${data.id}${linkText}${warningText}`, "success");
    showToast("기존 WordPress 글을 수정했습니다.");
  } catch (error) {
    const message = `${error.message || "WordPress 수정글 발행 중 오류가 발생했습니다."} 생성글 복사 버튼으로 내용을 복사해 수동 반영할 수 있습니다.`;
    setWpPublishStatus(message, "error");
    showToast(error.message || "WordPress 수정글 발행 중 오류가 발생했습니다.");
  } finally {
    publishDraftButton.disabled = false;
  }
}

async function publishWpDraft() {
  const payload = buildWpDraftPayload();

  if (!payload) {
    showToast("먼저 글을 생성해 주세요.");
    return;
  }

  if (isExistingRewriteMode()) {
    await publishExistingPostUpdate(payload);
    return;
  }

  if (!payload.images.length) {
    const shouldContinue = window.confirm("생성된 WP 이미지가 없습니다. 이미지 없이 임시글을 발행할까요?");
    if (!shouldContinue) return;
  }

  publishDraftButton.disabled = true;
  setWpPublishStatus("WordPress에 이미지와 임시글을 업로드하는 중입니다...");

  try {
    const response = await fetch("/api/wp-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `WordPress 임시글 발행 실패: HTTP ${response.status}`);

    const linkText = data.link ? ` 보기: ${data.link}` : "";
    const warningText = Array.isArray(data.warnings) && data.warnings.length
      ? ` / 참고: ${data.warnings.join(" ")}`
      : "";
    setWpPublishStatus(`임시글 발행 완료: #${data.id}${linkText}${warningText}`, "success");
    showToast("WordPress 임시글을 발행했습니다.");
  } catch (error) {
    const message = error.message || "WordPress 임시글 발행 중 오류가 발생했습니다.";
    setWpPublishStatus(message, "error");
    showToast(message);
  } finally {
    publishDraftButton.disabled = false;
  }
}

function copyTextToClipboard(text, successMessage) {
  navigator.clipboard
    .writeText(text)
    .then(() => showToast(successMessage))
    .catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast(successMessage);
    });
}

function clearOutputArea() {
  markdownOutput.value = "";
  seoReport.innerHTML = "";
  seoReport.classList.remove("is-visible");
  wpImageResultsData = [];
  renderWpImageResults();
  setWpImageStatus("");
  setWpPublishStatus("");
  clearCoverImage();
}

function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateGenerationStatus() {
  if (!generationStartedAt) return;
  generationStatus.textContent = `생성 중... ${formatElapsedTime(Date.now() - generationStartedAt)}`;
}

function startGenerationTimer() {
  generationStartedAt = Date.now();
  updateGenerationStatus();
  generationStatus.classList.add("is-visible");
  window.clearInterval(generationTimer);
  generationTimer = window.setInterval(updateGenerationStatus, 1000);
}

function stopGenerationTimer() {
  window.clearInterval(generationTimer);
  generationTimer = null;
  generationStartedAt = 0;
  generationStatus.textContent = "";
  generationStatus.classList.remove("is-visible");
}

function buildSeoTitle(baseTitle, concepts) {
  if (concepts.includes("Java Stream") && concepts.includes("Comparator")) {
    return "Java Stream 객체 정렬 예제: sorted()와 Comparator로 오름차순 정렬하기";
  }

  const conceptTitle = concepts.slice(0, 2).join("와 ");
  return conceptTitle ? `Java ${conceptTitle} 예제: ${baseTitle}` : `Java 예제: ${baseTitle}`;
}

function formatBulletList(value) {
  const lines = collapseBlankLines(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return "- 입력된 요구사항이 없습니다.";

  return lines.map((line) => (line.startsWith("-") ? line : `- ${line}`)).join("\n");
}

function formatDataBlock(value) {
  return collapseBlankLines(value) || "입력된 데이터가 없습니다.";
}

function parseProducts(data) {
  const productRegex = /new\s+Product\(\s*"([^"]+)"\s*,\s*(\d+)\s*\)/g;
  return [...data.matchAll(productRegex)].map((match) => ({
    name: match[1],
    price: Number(match[2]),
  }));
}

function buildExpectedOutput(data) {
  const products = parseProducts(data);

  if (!products.length) {
    return "실행 결과는 입력된 코드와 데이터에 따라 콘솔에 출력됩니다.";
  }

  const sortedProducts = [...products].sort((a, b) => a.price - b.price);

  return [
    "원본 상품 리스트:",
    ...products.map((product) => `${product.name} : ${product.price}$`),
    "",
    "가격 오름차순 정렬:",
    ...sortedProducts.map((product) => `${product.name} : ${product.price}$`),
  ].join("\n");
}

function buildCoreCodeExplanation(code) {
  const explanations = [];

  if (code.includes(".stream()")) {
    explanations.push(`\`\`\`java
products.stream()
\`\`\`

이 코드는 \`products\` 리스트를 Stream 형태로 바꿉니다. Stream을 사용하면 데이터를 순서대로 흘려보내면서 정렬, 필터링, 변환 같은 작업을 이어서 처리할 수 있습니다.`);
  }

  if (code.includes("Comparator.comparingInt")) {
    explanations.push(`\`\`\`java
.sorted(Comparator.comparingInt(Product::getPrice))
\`\`\`

이 코드는 \`Product\` 객체의 \`price\` 값을 기준으로 오름차순 정렬하라는 의미입니다. \`Comparator.comparingInt()\`는 숫자 값을 비교 기준으로 만들 때 자주 쓰는 방법입니다.`);
  }

  if (code.includes("Product::getPrice")) {
    explanations.push(`\`\`\`java
Product::getPrice
\`\`\`

이 코드는 각 \`Product\` 객체에서 \`getPrice()\`를 호출해 가격을 꺼내겠다는 메서드 참조입니다.`);
  }

  if (code.includes(".collect(Collectors.toList())")) {
    explanations.push(`\`\`\`java
.collect(Collectors.toList())
\`\`\`

Stream으로 처리한 결과를 다시 \`List\`로 모으는 코드입니다. 정렬된 결과를 변수에 저장하려면 마지막에 리스트로 변환해야 합니다.`);
  }

  return explanations.length
    ? explanations.join("\n\n")
    : "핵심 코드는 입력된 소스에서 반복문, 조건문, 메서드 호출 순서를 중심으로 읽으면 이해하기 쉽습니다.";
}

function buildMethodChainExplanation(code) {
  if (!code.includes(".stream()") || !code.includes(".sorted(")) return "";

  return `### 메서드 체이닝 순서대로 읽기

\`\`\`java
products.stream()
    .sorted(Comparator.comparingInt(Product::getPrice))
    .collect(Collectors.toList());
\`\`\`

1. \`products.stream()\`: 상품 리스트를 Stream으로 바꿉니다.
2. \`sorted(...)\`: Stream 안의 Product 객체를 가격 기준으로 정렬합니다.
3. \`collect(Collectors.toList())\`: 정렬된 결과를 다시 List로 모읍니다.

즉, 이 코드는 "상품 리스트를 Stream으로 만들고, 가격 기준으로 오름차순 정렬한 뒤, 다시 리스트로 저장한다"는 흐름입니다.`;
}

function buildConceptSummary(concepts) {
  const rows = [];

  if (concepts.includes("Java Stream")) rows.push("| Java Stream | 컬렉션 데이터를 선언적으로 처리할 수 있게 해주는 기능입니다. |");
  if (concepts.includes("sorted()")) rows.push("| sorted() | Stream의 데이터를 정렬할 때 사용하는 메서드입니다. |");
  if (concepts.includes("Comparator.comparingInt()")) rows.push("| Comparator.comparingInt() | int 값을 기준으로 객체를 비교할 때 사용합니다. |");
  if (concepts.includes("객체 리스트 정렬")) rows.push("| 객체 리스트 정렬 | 객체 안의 특정 값을 기준으로 리스트를 정렬하는 방식입니다. |");
  if (concepts.includes("오름차순 정렬")) rows.push("| 오름차순 정렬 | 작은 값에서 큰 값 순서로 정렬하는 방식입니다. |");

  if (!rows.length) rows.push("| Java 예제 | 코드를 직접 실행하며 개념을 익히는 학습 방식입니다. |");

  return ["| 개념 | 설명 |", "|---|---|", ...rows].join("\n");
}

function buildWrapUpTable(concepts) {
  const mainConcept = concepts.includes("Java Stream") ? "Java Stream 객체 리스트 정렬" : "Java 기본 예제";
  const coreMethod = concepts.includes("Comparator.comparingInt()")
    ? "sorted(), Comparator.comparingInt()"
    : concepts.slice(0, 2).join(", ") || "소스 코드 흐름";

  return `| 항목 | 내용 |
|---|---|
| 학습 주제 | ${mainConcept} |
| 핵심 메서드 | ${coreMethod} |
| 정렬 기준 | Product 객체의 price 값 |
| 정렬 방향 | 오름차순 |
| 초보자 포인트 | 객체 자체가 아니라 객체 안의 값을 기준으로 정렬한다는 점 |`;
}

function buildIntro(concepts, tone) {
  const keywordText = concepts.length ? concepts.join(", ") : "Java 예제";

  if (tone === "short") {
    return `이번 글에서는 ${keywordText}를 사용해 객체 리스트를 정렬하는 방법을 핵심만 정리합니다.`;
  }

  if (tone === "practice") {
    return `이번 예제에서는 Product 객체 리스트를 직접 만들고, ${keywordText}를 사용해 가격 오름차순으로 정렬해 보겠습니다.`;
  }

  return `Java를 공부하다 보면 숫자나 문자열뿐 아니라 객체 리스트를 정렬해야 하는 경우가 자주 있습니다. 이번 글에서는 ${keywordText}를 사용해 Product 객체 리스트를 가격 오름차순으로 정렬하는 방법을 초보자도 이해하기 쉽게 정리합니다.`;
}

function getExistingPostTitle(raw) {
  return String(raw || "")
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .find(Boolean) || "기존 블로그 글 SEO 수정";
}

function buildExistingSeoTitle(title, keywords) {
  const keywordList = String(keywords || "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const primaryKeyword = keywordList[0] || extractGenericKeywords(title, 1) || "블로그 SEO";
  const cleanTitle = String(title || "").replace(/[—–-]\s*실무\s*가이드/i, "").trim();
  const candidate = cleanTitle.includes(primaryKeyword)
    ? `${cleanTitle}: 실무 적용과 SEO 체크리스트`
    : `${primaryKeyword} 실무 가이드: ${cleanTitle}`;

  return candidate.length <= 70 ? candidate : candidate.slice(0, 67).trimEnd() + "...";
}

function generateExistingRewriteTemplateMarkdown(raw, keywords) {
  const title = getExistingPostTitle(raw);
  const keywordText = keywords || extractGenericKeywords(raw, 7);
  const keywordList = keywordText
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const primaryKeyword = keywordList[0] || "블로그 SEO";
  const secondaryKeyword = keywordList[1] || "실무 적용";
  const seoTitle = buildExistingSeoTitle(title, keywordText);
  const sourceSummary = stripMarkdownForDescription(raw).slice(0, 220);

  return `# ${seoTitle}

${primaryKeyword}를 주제로 기존 블로그 글을 다시 다듬을 때는 단순히 문장을 길게 늘리는 것보다 독자가 바로 얻어갈 답을 분명히 제시하는 것이 중요합니다. 이 글에서는 원문의 핵심 논지를 유지하면서 ${secondaryKeyword}, 적용 절차, 주의점, 조직 차원의 체크포인트를 함께 정리합니다.

## 원문에서 유지할 핵심 메시지

기존 글의 중심 내용은 다음 흐름으로 정리할 수 있습니다.

- 주제의 배경과 최근 변화
- 실무에서 바로 확인해야 할 적용 사례
- 보안, 거버넌스, 교육처럼 조직이 함께 준비해야 할 조건
- 개인과 팀이 다음 단계로 실행할 수 있는 체크리스트

원문 요약: ${sourceSummary || "기존 글의 핵심 주제를 바탕으로 SEO 친화적인 구조를 다시 구성합니다."}

## ${primaryKeyword}가 중요한 이유

${primaryKeyword}는 단순한 유행어가 아니라 실제 업무 방식과 학습 방식에 영향을 주는 주제입니다. 독자는 이 글을 통해 개념 정의만 확인하는 것이 아니라, 어떤 상황에서 적용해야 하는지와 도입 전에 무엇을 점검해야 하는지를 알고 싶어 합니다.

특히 ${secondaryKeyword} 관점에서는 기술 자체보다 운영 방식이 더 중요합니다. 도구를 도입해도 권한, 검증, 책임 소재가 정리되지 않으면 생산성 향상보다 혼란이 커질 수 있습니다. 따라서 본문은 트렌드 설명, 실무 적용, 위험 관리, 실행 체크리스트 순서로 읽히도록 구성하는 것이 좋습니다.

## 핵심 트렌드 정리

최근 흐름은 개인화, 자동화, 거버넌스라는 세 가지 축으로 나눌 수 있습니다. 개인화는 사용자의 업무 맥락에 맞춘 추천과 자동화를 의미하고, 자동화는 반복 작업을 줄여 더 중요한 판단에 시간을 쓰게 만드는 방향입니다. 거버넌스는 자동화가 늘어날수록 더 중요해지는 승인, 감사, 보안 기준입니다.

| 구분 | 정리 |
|---|---|
| 개인화 | 사용자 환경과 업무 맥락에 맞춘 지원이 중요합니다. |
| 자동화 | 반복 작업은 줄이고 검증과 판단에 집중해야 합니다. |
| 거버넌스 | 권한, 기록, 책임 소재를 명확히 해야 합니다. |

## 실무 적용 방법

실무에서는 한 번에 모든 것을 바꾸기보다 작은 범위에서 검증하는 방식이 안정적입니다. 예를 들어 개인 업무 보조, 문서 초안 작성, 테스트 자동화처럼 실패 비용이 낮고 효과 측정이 쉬운 영역부터 시작할 수 있습니다.

적용 순서는 다음처럼 가져가는 것이 좋습니다.

1. 현재 가장 반복적인 업무를 목록화합니다.
2. 민감 데이터가 포함되는지 먼저 분류합니다.
3. 작은 실험 범위를 정하고 결과를 기록합니다.
4. 검증 기준을 통과한 작업만 자동화 범위를 넓힙니다.
5. 팀 표준 문서와 승인 흐름을 함께 업데이트합니다.

## 체크리스트

- ${primaryKeyword}가 실제 독자의 문제와 연결되어 있는지 확인합니다.
- 첫 문단에서 글의 결론과 독자가 얻을 내용을 분명히 제시합니다.
- 각 H2 섹션이 검색 의도에 맞는 질문이나 답변 형태로 구성되어 있는지 점검합니다.
- 본문 중간에 ${keywordList.slice(0, 3).join(", ") || primaryKeyword} 키워드가 자연스럽게 반복되는지 확인합니다.
- 마지막에는 표 형태로 핵심 내용을 다시 정리합니다.

## 주의할 점

SEO를 맞추기 위해 같은 키워드를 반복해서 나열하면 오히려 글의 품질이 낮아 보일 수 있습니다. 중요한 것은 ${primaryKeyword}라는 표현을 문맥 안에서 자연스럽게 사용하고, 독자가 실제로 판단할 수 있는 기준을 충분히 제공하는 것입니다.

또한 기존 글을 수정할 때는 원문을 그대로 복사해 붙이는 방식보다 구조를 다시 잡는 편이 좋습니다. 제목, 첫 문단, H2 제목, FAQ, 요약 표를 새로 구성하면 검색엔진과 독자 모두에게 글의 목적이 더 선명하게 전달됩니다.

## 자주 묻는 질문

### 기존 글을 완전히 새 글처럼 바꿔야 하나요?

반드시 모든 내용을 바꿀 필요는 없습니다. 다만 제목, 첫 문단, 섹션 구조, FAQ, 마무리 표처럼 SEO와 독자 경험에 직접 영향을 주는 부분은 새롭게 정리하는 것이 좋습니다.

### 키워드는 몇 번 반복하는 것이 적절한가요?

정해진 횟수보다 자연스러움이 중요합니다. 제목, 첫 문단, 중간 섹션, 마무리 정리 안에 핵심 키워드가 들어가면 대부분의 블로그 글에서는 충분합니다.

### 기존 블로그의 빨간 SEO 항목은 어떻게 줄일 수 있나요?

제목 길이, 첫 문단의 키워드 포함, H2 구조, 본문 길이, FAQ, 마무리 표를 먼저 확인하세요. 이 항목들은 글의 구조와 내용만 수정해도 개선되는 경우가 많습니다.

## 마무리 정리

| 항목 | 정리 |
|---|---|
| 포커스 키워드 | ${primaryKeyword} |
| 보조 키워드 | ${keywordList.slice(1, 5).join(", ") || secondaryKeyword} |
| 수정 방향 | 원문 논지를 유지하되 제목, 첫 문단, H2, FAQ, 표를 SEO 기준에 맞게 재구성 |
| 실무 포인트 | 적용 방법, 체크리스트, 주의점을 독자가 바로 사용할 수 있게 제시 |
`;
}

function generateGenericTemplateMarkdown(raw, keywords) {
  const menu = getCurrentMenu();
  const topicTitle = raw.match(/\[주제\]\s*(.+)/)?.[1]?.trim() || raw.split("\n")[0]?.trim() || `${menu.label} 블로그 주제`;
  const keywordText = keywords || extractGenericKeywords(raw || topicTitle);
  const toneLabel = toneSelect.options[toneSelect.selectedIndex]?.textContent || "블로그형";

  return `# ${topicTitle}

${topicTitle}는 최근 ${menu.label} 분야에서 눈여겨볼 만한 주제입니다. 이 글에서는 핵심 배경, 주요 쟁점, 독자가 바로 이해할 수 있는 관점, 그리고 실무적으로 확인할 부분을 ${toneLabel} 톤으로 정리합니다.

## 핵심 키워드

${keywordText.split(",").map((keyword) => `- ${keyword.trim()}`).filter((line) => line !== "-").join("\n") || "- 최신 블로그 주제"}

## 이 주제가 중요한 이유

최근 ${menu.label} 분야의 흐름은 빠르게 바뀌고 있습니다. 단순한 뉴스 소개에 그치지 않고, 이 변화가 독자에게 어떤 영향을 주는지 함께 살펴볼 필요가 있습니다.

## 주요 내용 정리

- 현재 이슈의 배경과 등장 이유
- 관련 흐름이나 시장 변화의 핵심 포인트
- 실제 업무나 학습에 적용할 때 확인해야 할 점
- 앞으로 이어질 가능성이 있는 변화

## 활용 관점에서 볼 점

이 주제를 블로그 콘텐츠로 다룰 때는 단순한 정보 전달보다 독자가 바로 판단할 수 있는 기준을 제시하는 것이 중요합니다. 무엇이 달라졌는지, 어떤 사람에게 영향이 큰지, 지금 확인해야 할 행동은 무엇인지 순서대로 정리하면 글의 활용도가 높아집니다.

## 바로 확인할 체크리스트

- 이 주제가 내 업무, 학습, 의사결정 목표와 직접 관련이 있는지 확인합니다.
- 단순한 유행어가 아니라 실제 문제 해결이나 판단에 도움이 되는지 살펴봅니다.
- 비용, 보안, 유지보수, 학습 난이도처럼 현실적인 조건을 함께 비교합니다.
- 적용 전 작은 실험으로 효과를 검증할 수 있는지 확인합니다.

## 주의할 점

최신 이슈는 발표 내용만 보고 판단하면 과장된 결론에 도달하기 쉽습니다. 실제로는 독자의 상황, 목표, 기존 조건에 따라 결과가 크게 달라질 수 있습니다. 따라서 블로그 글에서는 장점뿐 아니라 한계와 확인해야 할 조건을 함께 정리하는 편이 독자에게 더 도움이 됩니다.

## 자주 묻는 질문

### 이 주제를 지금 바로 적용해야 하나요?

모든 상황에서 바로 적용할 필요는 없습니다. 먼저 현재 문제와 연결되는 부분이 있는지 확인하고, 작은 범위에서 테스트한 뒤 확대하는 방식이 안전합니다.

### 초보자는 무엇부터 보면 좋을까요?

핵심 용어와 배경을 먼저 이해한 뒤, 실제 사례나 간단한 실습을 통해 흐름을 잡는 것이 좋습니다. 처음부터 세부 구현이나 복잡한 비교표에 매달리면 전체 맥락을 놓치기 쉽습니다.

### 블로그 글로 다룰 때 가장 중요한 점은 무엇인가요?

단순히 소식을 전달하는 것보다 독자가 어떤 판단을 할 수 있게 도와주는지가 중요합니다. 배경, 장단점, 적용 조건, 다음에 확인할 내용을 함께 제시하면 글의 가치가 높아집니다.

## 마무리 정리

| 항목 | 내용 |
|---|---|
| 글 주제 | ${topicTitle} |
| 메뉴 | ${menu.label} |
| 핵심 키워드 | ${keywordText} |
| 작성 톤 | ${toneLabel} |
`;
}

async function generateGeneratedAssets() {
  if (isExistingRewriteMode()) {
    refreshSeoReport();
    return;
  }

  const jobs = [];

  if (autoWpImagesCheck?.checked) jobs.push(generateWordPressImages());

  if (jobs.length) {
    await Promise.allSettled(jobs);
    refreshSeoReport();
  }
}

async function generateMarkdown() {
  const raw = sourceInput.value.trim();

  if (!raw) {
    showToast("먼저 원본 입력을 붙여 넣어 주세요.");
    sourceInput.focus();
    return;
  }

  const sections = parseSections(raw);
  const code = tidyJavaCode(sections.source);
  const keywords = syncKeywordsFromSource(raw);
  const concepts = getConcepts(`${sections.title}\n${sections.problem}\n${sections.requirements}`, code, keywords);
  const title = buildSeoTitle(sections.title, concepts);
  const className = getClassName(code);
  const chainExplanation = buildMethodChainExplanation(code);
  const codeNote = fixCodeCheck.checked
    ? "> 원본 코드의 전체 흐름은 유지하되, 아래 소스는 워드프레스에서 읽기 쉽도록 빈 줄과 들여쓰기를 정리한 버전입니다."
    : "";

  const markdown = `# ${title}

${buildIntro(concepts, toneSelect.value)}

본문에서는 ${keywords || "Java 예제"} 키워드를 중심으로 문제, 코드, 실행 결과, 개념을 차례대로 살펴봅니다.

## 문제

${collapseBlankLines(sections.problem) || "문제 내용이 입력되지 않았습니다."}

## 데이터 또는 입력 예시

\`\`\`java
${formatDataBlock(sections.data)}
\`\`\`

## 요구사항

${formatBulletList(sections.requirements)}

## 전체 소스 코드

${codeNote}

\`\`\`java
${code}
\`\`\`

## 핵심 코드 설명

이번 예제의 핵심은 \`${className}\` 클래스 안에서 Product 리스트를 Stream으로 변환한 뒤 가격을 기준으로 정렬하는 부분입니다.

${buildCoreCodeExplanation(code)}

${chainExplanation}

## 실행 결과

\`\`\`text
${buildExpectedOutput(sections.data)}
\`\`\`

출력 결과를 보면 가격이 가장 낮은 항목이 먼저 나오고, 가장 높은 항목이 마지막에 출력됩니다.

## 개념 정리

${buildConceptSummary(concepts)}

객체 리스트 정렬에서 중요한 점은 "객체 전체를 비교하는 것이 아니라 어떤 값을 기준으로 비교할 것인지 정해야 한다"는 것입니다. 이 예제에서는 \`Product::getPrice\`를 사용해 가격을 꺼내고, \`Comparator.comparingInt()\`로 그 가격을 비교했습니다.

## 초보자가 자주 헷갈리는 부분

- \`sorted()\`는 원본 리스트를 직접 바꾸는 것이 아니라 정렬된 Stream 결과를 만듭니다.
- 객체 리스트를 정렬할 때는 객체 자체가 아니라 비교 기준이 되는 필드를 정해야 합니다.
- \`Product::getPrice\`는 \`product -> product.getPrice()\`와 비슷한 의미의 메서드 참조입니다.
- 정렬 결과를 계속 사용하려면 \`collect(Collectors.toList())\`로 다시 리스트에 담아야 합니다.

## 직접 연습해 볼 과제

1. 가격 오름차순이 아니라 내림차순으로 정렬해 보세요.
2. 가격이 같은 상품이 있을 때 이름순으로 한 번 더 정렬해 보세요.
3. \`Product\`에 카테고리 필드를 추가하고 특정 카테고리만 필터링한 뒤 정렬해 보세요.

## 자주 묻는 질문

### sorted()를 쓰면 원본 리스트가 바뀌나요?

아니요. Stream의 \`sorted()\`는 정렬된 흐름을 새로 만들 뿐 원본 리스트 자체를 직접 변경하지 않습니다. 원본 데이터를 바꾸고 싶다면 별도의 리스트에 담거나 \`List.sort()\` 같은 방법을 사용해야 합니다.

### Comparator.comparingInt()는 언제 쓰나요?

객체 안의 \`int\` 값을 기준으로 정렬할 때 사용합니다. 가격, 나이, 점수처럼 숫자 필드를 기준으로 정렬할 때 코드가 짧고 읽기 쉬워집니다.

### 메서드 참조가 어렵다면 람다식으로 써도 되나요?

네. \`Product::getPrice\`가 어렵다면 \`product -> product.getPrice()\`처럼 람다식으로 먼저 이해해도 됩니다. 두 방식 모두 Product 객체에서 가격 값을 꺼내 비교 기준으로 사용한다는 의미입니다.

## 마무리 정리

${buildWrapUpTable(concepts)}
`;

  markdownOutput.value = stripWordPressImagePrompt(markdown);
  renderSeoReport(auditSeoMarkdown(markdownOutput.value, keywordInput.value.trim()));
  await generateGeneratedAssets();
  showToast("워드프레스용 Markdown 글을 생성했습니다.");
}

async function handleGenerateClick() {
  clearOutputArea();
  const provider = providerSelect.value;

  if (provider === "template") {
    if (isJavaMode()) await generateMarkdown();
    else if (isExistingRewriteMode()) {
      const raw = sourceInput.value.trim();
      if (!raw) {
        showToast("먼저 기존 블로그 글을 붙여 넣어 주세요.");
        sourceInput.focus();
        return;
      }
      const keywords = keywordInput.value.trim() || extractExistingPostKeywords(raw);
      if (!keywordInput.value.trim()) {
        keywordInput.value = keywords;
        lastAutoKeywords = keywords;
      }
      markdownOutput.value = generateExistingRewriteTemplateMarkdown(raw, keywords);
      renderSeoReport(auditSeoMarkdown(markdownOutput.value, keywords));
      await generateGeneratedAssets();
      showToast("기존 블로그 글을 SEO용 Markdown으로 재작성했습니다.");
    }
    else {
      const raw = sourceInput.value.trim();
      if (!raw) {
        showToast("먼저 블로그 주제를 선택하거나 입력해 주세요.");
        sourceInput.focus();
        return;
      }
      const keywords = keywordInput.value.trim() || extractGenericKeywords(raw);
      markdownOutput.value = generateGenericTemplateMarkdown(raw, keywords);
      renderSeoReport(auditSeoMarkdown(markdownOutput.value, keywords));
      await generateGeneratedAssets();
      showToast("워드프레스용 Markdown 글을 생성했습니다.");
    }
    return;
  }

  await generateWithAi(provider);
}

async function generateWithAi(provider) {
  const raw = sourceInput.value.trim();

  if (!raw) {
    showToast("먼저 원본 입력을 붙여 넣어 주세요.");
    sourceInput.focus();
    return;
  }

  const keywords = isJavaMode()
    ? syncKeywordsFromSource(raw)
    : (keywordInput.value.trim() || (isExistingRewriteMode() ? extractExistingPostKeywords(raw) : extractGenericKeywords(raw)));
  if (!isJavaMode() && !keywordInput.value.trim()) {
    keywordInput.value = keywords;
    lastAutoKeywords = keywords;
  }
  const payload = {
    provider,
    input: raw,
    keywords,
    tone: toneSelect.options[toneSelect.selectedIndex]?.textContent || toneSelect.value,
    mode: isJavaMode() ? "java" : (isExistingRewriteMode() ? "existing-rewrite" : "generic"),
    categoryId: currentMenuId,
    categoryLabel: getCurrentMenu().label,
    selectedTopic,
    includeImagePrompt: false,
    includeCodeFixNotice: fixCodeCheck.checked,
    seoAutoRefine: seoAutoRefineCheck.checked,
  };

  if (provider === "openai") payload.model = openaiModelInput.value.trim();
  if (provider === "ollama") payload.model = ollamaModelInput.value.trim();

  setLoading(true);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `AI 생성 요청 실패: HTTP ${response.status}`);

    markdownOutput.value = stripWordPressImagePrompt(data.markdown || "");
    const seoResult = auditSeoMarkdown(markdownOutput.value, keywordInput.value.trim());
    seoResult.revised = Boolean(data.seoReport?.revised);
    renderSeoReport(seoResult);
    await generateGeneratedAssets();
    showToast(isExistingRewriteMode()
      ? `${provider === "openai" ? "OpenAI" : "Ollama"}로 기존 블로그 글을 SEO용 Markdown으로 재작성했습니다.`
      : `${provider === "openai" ? "OpenAI" : "Ollama"}로 Markdown 글을 생성했습니다.`);
  } catch (error) {
    showToast(error.message || "AI 생성 중 오류가 발생했습니다.");
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  generateButton.disabled = isLoading;
  generateButton.textContent = isLoading ? "생성 중..." : "글 생성";

  if (isLoading) startGenerationTimer();
  else stopGenerationTimer();
}

function updateProviderFields() {
  const provider = providerSelect.value;

  document.querySelectorAll("[data-provider-field]").forEach((field) => {
    const isActive = field.dataset.providerField === provider;
    field.hidden = !isActive;
    field.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = !isActive;
    });
  });
}

function auditSeoMarkdown(markdown, keywordText) {
  const keywords = keywordText
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const primaryKeyword = keywords[0] || "Java";
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] || "";
  const bodyWithoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  const lowerBody = bodyWithoutCode.toLowerCase();
  const checks = [
    {
      label: "제목에 Java와 핵심 키워드가 포함되어 있습니다.",
      passed: title.includes("Java") && title.toLowerCase().includes(primaryKeyword.toLowerCase().split(" ")[0]),
    },
    {
      label: "제목 길이가 검색 결과에서 읽기 좋은 범위입니다.",
      passed: title.length >= 25 && title.length <= 70,
    },
    {
      label: "본문에 핵심 키워드가 자연스럽게 반복됩니다.",
      passed: keywords.slice(0, 5).filter((keyword) => lowerBody.includes(keyword.toLowerCase())).length >= Math.min(3, keywords.length || 3),
    },
    {
      label: "H2 섹션 구조가 워드프레스 글에 맞게 구성되어 있습니다.",
      passed: (markdown.match(/^##\s+/gm) || []).length >= 7,
    },
    {
      label: "java와 text 코드 블록이 포함되어 있습니다.",
      passed: markdown.includes("```java") && markdown.includes("```text"),
    },
    {
      label: "마무리 정리 표가 포함되어 있습니다.",
      passed: markdown.includes("|") && markdown.includes("---"),
    },
  ];
  const passedCount = checks.filter((check) => check.passed).length;

  return {
    passed: passedCount === checks.length,
    score: Math.round((passedCount / checks.length) * 100),
    checks,
    revised: false,
  };
}

function auditSeoMarkdown(markdown, keywordText) {
  const keywords = String(keywordText || "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const primaryKeyword = keywords[0] || (isJavaMode() ? "Java" : getCurrentMenu().label);
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] || "";
  const bodyWithoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  const lowerBody = bodyWithoutCode.toLowerCase();
  const h2Count = (markdown.match(/^##\s+/gm) || []).length;
  const metaDescription = buildMetaDescription(markdown, keywords);
  const slug = slugifyPostTitle(title, keywords);
  const textLength = stripMarkdownForDescription(markdown).length;
  const faqCount = (markdown.match(/^###\s+/gm) || []).length;
  const hasFaqSection = /##\s*(자주\s*묻는\s*질문|FAQ)/i.test(markdown);
  const hasPracticalSection = /##\s*(실무|직접\s*연습|체크리스트|주의|적용|활용)/i.test(markdown);
  const firstParagraph = bodyWithoutCode
    .replace(/^#\s+.+$/m, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#")) || "";
  const imageAltReady = ["featured", "content", "contentSecondary"].every((type) => {
    const result = getImageResult(type);
    return Boolean(result?.metadata?.altText);
  });
  const imageSeoReady = !wpImageResultsData.length || imageAltReady;
  const checks = [
    {
      label: isJavaMode() ? "제목에 Java와 핵심 키워드가 포함되어 있습니다." : "제목에 핵심 주제 또는 키워드가 포함되어 있습니다.",
      passed: isJavaMode()
        ? title.includes("Java") && title.toLowerCase().includes(primaryKeyword.toLowerCase().split(" ")[0])
        : title.toLowerCase().includes(primaryKeyword.toLowerCase().split(" ")[0]) || title.length >= 12,
    },
    {
      label: "제목 길이가 검색 결과에서 읽기 좋은 범위입니다.",
      passed: title.length >= 25 && title.length <= 70,
    },
    {
      label: "본문에 핵심 키워드가 자연스럽게 반영되어 있습니다.",
      passed: keywords.slice(0, 5).filter((keyword) => lowerBody.includes(keyword.toLowerCase())).length >= Math.min(3, keywords.length || 3),
    },
    {
      label: "H2 섹션 구조가 워드프레스 글에 맞게 구성되어 있습니다.",
      passed: h2Count >= 7,
    },
    {
      label: "마무리 정리 표가 포함되어 있습니다.",
      passed: markdown.includes("|") && markdown.includes("---"),
    },
    {
      label: "메타 설명이 검색 결과에 쓰기 좋은 길이로 준비되어 있습니다.",
      passed: metaDescription.length >= 80 && metaDescription.length <= 155,
    },
    {
      label: "게시용 슬러그가 짧고 읽기 좋게 준비되어 있습니다.",
      passed: slug.length >= 5 && slug.length <= 70,
    },
    {
      label: "첫 설명 문단에 핵심 키워드가 반영되어 있습니다.",
      passed: firstParagraph.toLowerCase().includes(primaryKeyword.toLowerCase().split(" ")[0]),
    },
    {
      label: "이미지 생성 결과가 있으면 alt 텍스트가 준비되어 있습니다.",
      passed: imageSeoReady,
    },
    {
      label: "본문이 얇은 콘텐츠로 보이지 않을 만큼 충분히 작성되어 있습니다.",
      passed: textLength >= 1200,
    },
    {
      label: "FAQ 섹션이 있어 독자의 추가 질문에 답합니다.",
      passed: hasFaqSection && faqCount >= 3,
    },
    {
      label: "실전 적용, 체크리스트, 주의점 중 하나 이상을 포함합니다.",
      passed: hasPracticalSection,
    },
  ];

  if (isJavaMode()) {
    checks.splice(4, 0, {
      label: "java와 text 코드 블록이 포함되어 있습니다.",
      passed: markdown.includes("```java") && markdown.includes("```text"),
    });
  }

  const passedCount = checks.filter((check) => check.passed).length;

  return {
    passed: passedCount === checks.length,
    score: Math.round((passedCount / checks.length) * 100),
    checks,
    details: {
      focusKeyword: primaryKeyword,
      seoTitle: title.length <= 65 ? title : title.slice(0, 62).trimEnd() + "...",
      metaDescription,
      slug,
      textLength,
    },
    revised: false,
  };
}

function renderSeoReport(report) {
  if (!report) return;

  const statusClass = report.passed ? "pass" : "fail";
  const statusText = report.passed ? "통과" : "수정 필요";
  const revisedText = report.revised ? " / AI 자동 재수정 적용" : "";
  const details = report.details || {};
  const detailsHtml = details.focusKeyword ? `
    <div class="seo-details">
      <p><strong>포커스 키워드</strong> ${escapeHtml(details.focusKeyword)}</p>
      <p><strong>SEO 제목</strong> ${escapeHtml(details.seoTitle || "")}</p>
      <p><strong>메타 설명</strong> ${escapeHtml(details.metaDescription || "")}</p>
      <p><strong>슬러그</strong> ${escapeHtml(details.slug || "")}</p>
      <p><strong>본문 길이</strong> ${Number(details.textLength || 0).toLocaleString("ko-KR")}자</p>
    </div>
  ` : "";
  const items = (report.checks || [])
    .map((check) => `<li><span class="${check.passed ? "pass" : "fail"}">${check.passed ? "통과" : "미흡"}</span> ${escapeHtml(check.label)}</li>`)
    .join("");

  seoReport.innerHTML = `
    <strong>SEO 점검 결과: <span class="${statusClass}">${statusText}</span> (${report.score || 0}점${revisedText})</strong>
    ${detailsHtml}
    <ul>${items}</ul>
  `;
  seoReport.classList.add("is-visible");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function copyMarkdown() {
  if (!markdownOutput.value.trim()) {
    showToast("복사할 Markdown이 없습니다.");
    return;
  }

  navigator.clipboard
    .writeText(markdownOutput.value)
    .then(() => showToast("Markdown을 클립보드에 복사했습니다."))
    .catch(() => {
      markdownOutput.select();
      document.execCommand("copy");
      showToast("Markdown을 클립보드에 복사했습니다.");
    });
}

function downloadMarkdown() {
  if (!markdownOutput.value.trim()) {
    showToast("다운로드할 Markdown이 없습니다.");
    return;
  }

  const blob = new Blob([markdownOutput.value], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = isExistingRewriteMode() ? "seo-rewritten-blog-post.md" : "java-blog-post.md";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Markdown 파일 다운로드를 시작했습니다.");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

sampleButton.addEventListener("click", () => {
  sourceInput.value = sampleInput;
  handleGenerateClick();
});

toolList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-menu-id]");
  if (!button) return;
  applyMenu(button.dataset.menuId);
});

topicSuggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-topic-index]");
  if (!button) return;
  selectSuggestedTopic(Number(button.dataset.topicIndex));
});

refreshTopicsButton.addEventListener("click", () => {
  const query = activeTopicQuery || topicSearchInput?.value.trim() || getCurrentMenu().searchQuery || getCurrentMenu().label;
  topicCache.delete(getTopicCacheKey(currentMenuId, query));
  loadTrendingTopics(currentMenuId, { force: true, query });
});

topicSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = topicSearchInput.value.trim();

  if (!query) {
    showToast("검색할 키워드를 입력해 주세요.");
    topicSearchInput.focus();
    return;
  }

  selectedTopic = null;
  clearOutputArea();
  loadTrendingTopics(currentMenuId, { force: true, query });
});

clearSourceButton.addEventListener("click", () => {
  sourceInput.value = "";
  selectedTopic = null;
  clearOutputArea();

  if (keywordInput.value.trim() === lastAutoKeywords) {
    keywordInput.value = "";
    lastAutoKeywords = "";
  }

  sourceInput.focus();
  showToast("원본 입력을 지웠습니다.");
});

providerSelect.addEventListener("change", updateProviderFields);
generateButton.addEventListener("click", handleGenerateClick);
generateCoverButton.addEventListener("click", generateCoverImage);
downloadCoverButton.addEventListener("click", downloadCoverImage);
thumbnailTitleInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  generateCoverImage();
});
thumbnailTitleInput?.addEventListener("input", () => {
  coverImageReady = false;
  if (downloadCoverButton) downloadCoverButton.disabled = true;
});
thumbnailTemplateSelect?.addEventListener("change", () => {
  updateThumbnailTemplateSelection();
  if (coverImageReady || thumbnailTitleInput?.value.trim()) generateCoverImage();
});
thumbnailTemplateChoices?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-template-id]");
  if (!button || !thumbnailTemplateSelect) return;
  thumbnailTemplateSelect.value = button.dataset.templateId;
  updateThumbnailTemplateSelection();
  if (coverImageReady || thumbnailTitleInput?.value.trim()) generateCoverImage();
});
generateWpImagesButton.addEventListener("click", generateWordPressImages);
downloadWpImagesButton.addEventListener("click", downloadAllWordPressImages);
publishDraftButton.addEventListener("click", publishWpDraft);
copyWpMetadataButton.addEventListener("click", () => {
  if (!wpImageResultsData.length) {
    showToast("복사할 WP 이미지 메타데이터가 없습니다.");
    return;
  }

  copyTextToClipboard(formatAllWpMetadata(), "WP 이미지 메타데이터 전체를 복사했습니다.");
});
wpImageResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-wp-action]");
  if (!button) return;

  const index = Number(button.dataset.index);
  const result = wpImageResultsData[index];
  if (!result) return;

  if (button.dataset.wpAction === "download") {
    downloadWordPressImage(index);
    return;
  }

  if (button.dataset.wpAction === "copy-all") {
    copyTextToClipboard(formatWpMetadata(result.metadata || {}), "메타데이터 전체를 복사했습니다.");
    return;
  }

  if (button.dataset.wpAction === "copy-field") {
    copyTextToClipboard(result.metadata?.[button.dataset.key] || "", "메타데이터 항목을 복사했습니다.");
  }
});
copyButton.addEventListener("click", copyMarkdown);
downloadButton.addEventListener("click", downloadMarkdown);

renderThumbnailTemplates();
applyMenu("java", { reset: false });
updateProviderFields();
clearOutputArea();
