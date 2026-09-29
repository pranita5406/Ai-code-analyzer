# ⚡ CodePulse AI — Grammarly for Code

CodePulse AI is a developer tool designed to perform static code analysis and AI-driven code reviews for full-stack candidate environments. Paste code snippets to get instant Big-O complexity calculations, security bug detection, and side-by-side refactoring.

## 🚀 Key Features

* **AST Parsing (Deterministic Static Analysis)**: Parses code syntax trees locally (via `esprima`) to trace loop nesting depths and evaluate Time & Space complexity BEFORE any AI execution.
* **Gemini AI Review Engine**: Integrates Google Gemini 2.0 Flash to spot security threats, algorithmic bottlenecks, and structural anomalies.
* **Monaco Diff Workspace**: Interactive side-by-side Monaco code editor comparing original and AI-optimized versions of code.
* **Hash-based Caching**: Uses Upstash Redis caching (SHA-256 code hashes) to bypass expensive Gemini API costs.
* **STEP Portfolio Dashboard**: Modular UI containing Health Gauge gauges (0-100), Big-O metrics, filterable bugs feed, and analysis history logs.

---

## 🛠️ Architecture & System Design

```mermaid
flowchart TD
    A["👨‍💻 Developer Pastes Code"] --> B["React Frontend<br/>(Monaco Editor)"]
    B -->|"POST /api/analyze"| C["Express Backend"]
    C --> D{"SHA-256 Hash<br/>Check Redis Cache"}
    D -->|"Cache HIT ⚡"| H["Return Cached Results"]
    D -->|"Cache MISS"| E["AST Parser (esprima)<br/>→ Loop Depth → Big-O"]
    E --> F["Gemini API Call<br/>→ Review + Refactored Code"]
    F --> G["Save to Supabase<br/>+ Cache in Redis"]
    G --> H
    H --> I["Frontend Renders 3 Panels"]
```

---

## ⚙️ Setup & Installation

### Prerequisite Environment Keys

Create `.env` in `server/`:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
REDIS_URL=rediss://default:token@your-redis.upstash.io:6379
```

Create `.env` in `client/`:
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Installation Commands

1. **Clone the repo & install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Run developer servers concurrently**:
   ```bash
   npm run dev
   ```

   * Frontend will listen at: `http://localhost:5173`
   * Backend API listens at: `http://localhost:3001`

---

## 🧪 Verification & Manual Testing

1. Paste a nested loop function into the Monaco editor:
   ```javascript
   function findPairs(arr) {
     for (var i = 0; i < arr.length; i++) {
       for (var j = 0; j < arr.length; j++) {
         if (arr[i] + arr[j] === 10) console.log(arr[i], arr[j]);
       }
     }
   }
   ```
2. Hit **Analyze Code**.
3. Verify that:
   * **Health Score** shows low (~60-70 due to nested loops + var usage + console logs).
   * **Time Complexity** calculates to `O(N²)`.
   * **Monaco Diff** replaces `var` and changes nested loops to hash map patterns.
   * **Insights Feed** registers performance warnings, security risks, and best practices.

---

## 📂 Monorepo Structure

```
codepulse-ai/
├── client/          # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/ # HealthScore, CodeMetrics, CodeEditor, InsightsFeed
│   │   ├── context/    # Global State & Auth Contexts
│   │   └── styles/     # Variables & global rules
├── server/          # Express API Backend
│   ├── src/
│   │   ├── services/   # AST parser, Gemini API, Redis, and Supabase connections
│   │   └── controllers/# Business logic orchestrators
```
