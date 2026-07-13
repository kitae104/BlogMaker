# BlogMaker

WordPress에 바로 붙여 넣을 수 있는 Markdown 블로그 글 작성 도우미입니다.

현재 구현된 도구는 Java 프로그래밍 교육용 글 작성기입니다. 사용자가 Java 문제, 데이터, 요구사항, 소스 코드를 입력하면 OpenAI 또는 Ollama를 이용해 초급자 대상 설명, 전체 소스 코드, 핵심 코드 설명, 실행 결과, 개념 정리표를 포함한 Markdown 글을 생성합니다. 생성된 글을 기반으로 WordPress용 대표 이미지와 본문 이미지, 이미지 메타데이터도 만들 수 있습니다.

## 실행 방법

Node.js 18 이상이 필요합니다.

PowerShell에서 자동 실행하려면 아래 명령을 사용합니다.

```powershell
.\run.ps1
```

실행 정책 때문에 막히는 경우에는 아래처럼 실행할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

브라우저를 자동으로 열지 않으려면 다음 옵션을 사용합니다.

```powershell
.\run.ps1 -NoBrowser
```

다른 포트로 실행하려면 다음처럼 지정합니다.

```powershell
.\run.ps1 -Port 4174
```

기존 BlogMaker 서버를 종료하고 다시 시작하려면 다음 옵션을 사용합니다.

```powershell
.\run.ps1 -StopExisting
```

직접 Node 명령으로 실행할 수도 있습니다.

```bash
npm start
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:4173/
```

## OpenAI 사용

`.env.example`을 참고해 `.env` 파일을 만들고 `OPENAI_API_KEY`를 설정합니다.

```text
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-5.4-mini
PORT=4173
```

그 다음 화면의 `작성 엔진`에서 `OpenAI`를 선택하고 글을 생성합니다.

API 키는 브라우저 코드에 넣지 않고 `server.js`에서만 읽습니다.

OpenAI 모델은 화면에서 콤보 박스로 선택할 수 있습니다. 기본값은 `gpt-5.4-mini`입니다.

현재 선택 목록:

- `gpt-5.5`
- `gpt-5.4`
- `gpt-5.4-mini`
- `gpt-5.4-nano`
- `gpt-5.6` preview
- `gpt-4.1`
- `gpt-4.1-mini`
- `gpt-4.1-nano`
- `gpt-4o`
- `gpt-4o-mini`
- `o4-mini`
- `o3`
- `o3-mini`

`gpt-5.6`은 프리뷰 모델이므로 계정 권한에 따라 사용할 수 없을 수 있습니다.

## Ollama 사용

Ollama 서버가 실행 중이어야 합니다. 기본 주소는 아래 원격 Ollama 서버로 설정되어 있습니다.

```text
http://114.71.147.30:21434
```

`.env`에 기본 모델과 주소를 설정할 수 있습니다.

```text
OLLAMA_BASE_URL=http://114.71.147.30:21434
OLLAMA_MODEL=qwen3.6:35b-a3b
```

화면의 `작성 엔진`에서 `Ollama`를 선택하고 모델 콤보 박스에서 사용할 모델을 고르면 됩니다.

글 작성용으로는 `qwen3.6:35b-a3b`, `exaone3.5:32B`, `qwen3:32B`, `gemma4:latest`, `gpt-oss:latest` 같은 텍스트 생성 모델을 우선 권장합니다. `bge-m3`, `mxbai-embed-large`, `nomic-embed-text` 계열은 임베딩 모델이라 블로그 글 생성 품질에는 적합하지 않을 수 있습니다.

## WordPress 이미지 생성

`wp-image-generator` 기능을 BlogMaker에 통합했습니다. 생성된 Markdown 글의 제목과 본문을 기반으로 Gemini가 다음 3개 이미지를 생성합니다.

- 대표 이미지: 1200 x 630 WebP, 제목 오버레이 포함
- 본문 이미지 1: 1024px 폭 WebP
- 본문 이미지 2: 1024px 폭 WebP
- 각 이미지별 WordPress 메타데이터: 대체 텍스트, 제목, 캡션, 설명

`.env`에 Gemini API 키를 추가합니다.

```text
GEMINI_API_KEY=your-gemini-api-key
GEMINI_PROMPT_MODEL=gemini-2.5-flash-lite
GEMINI_IMAGE_MODEL=imagen-4.0-fast-generate-001
```

기본값으로 `글 생성 후 자동 생성`이 켜져 있어 글 생성 버튼을 누르면 현재 생성된 글을 바탕으로 대표 이미지와 WP 이미지 3종, 이미지별 메타데이터를 함께 생성합니다. 필요하면 화면의 `WP 이미지 3종 생성` 버튼으로 다시 생성할 수 있습니다. API 키는 브라우저에 노출하지 않고 `server.js`에서만 사용합니다.

## 입력 형식

```text
글 주제

[문제]
문제 설명

[데이터]
예시 데이터

[요구사항]
- 요구사항 1
- 요구사항 2

[소스]
Java 소스 코드
```

## 현재 기능

- Java 블로그 글 자동 생성
- 로컬 템플릿 생성, OpenAI 생성, Ollama 생성 선택
- `[문제]`, `[데이터]`, `[요구사항]`, `[소스]` 형식 입력 지원
- SEO 친화적인 제목 생성
- SEO 자동 검사 및 AI 재수정
- Java Stream, `sorted()`, `Comparator`, 메서드 참조 설명
- 코드 오류가 있을 때 수정 제안 요청
- 로컬/Ollama 대표 이미지 생성
- Gemini 기반 WordPress 이미지 3종 생성 및 WebP 최적화
- WordPress 이미지 메타데이터 생성 및 복사
- Markdown 복사 및 다운로드

## SEO 자동 검사 기준

AI 생성 결과는 다음 기준으로 점검합니다.

- 제목에 Java와 핵심 키워드 포함
- 제목 길이 25~70자 범위
- 본문 내 핵심 키워드 자연스러운 반복
- H2 섹션 7개 이상
- `java`, `text` 코드 블록 언어명 포함
- 마무리 정리표 포함

`SEO 자동 검사 및 재수정` 옵션이 켜져 있으면 OpenAI 또는 Ollama 생성 결과가 기준을 통과하지 못할 때 같은 AI 엔진으로 한 번 더 수정 요청을 보냅니다.

## 점검

```bash
npm run check
```

## 확장 방향

일반 IT 글 작성기나 다른 프로그래밍 언어용 글 작성기는 `server.js`의 프롬프트와 `app.js`의 템플릿 함수를 추가하는 방식으로 확장할 수 있습니다.
