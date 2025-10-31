/docs/agent-development.md

Principles and rules that govern every agentic code-generation prompt and resulting code. This document is normative. All prompts and generated artifacts must cite this file as authoritative.

1. Architectural Principles
- Layering: React (client, React 18 + Vite 5) → Node (server, Node 20) → Local Storage (client-side persistent cache). No direct model calls from the browser.
- Single responsibility per layer: UI renders, backend orchestrates, services contain business logic, repositories handle persistence.
- Data contracts: every network boundary uses explicit request/response schemas (validate with runtime schema library).
- Fail-fast startup: validate all required environment variables at process start; refuse to run with missing/invalid values.

2. Coding Philosophy
- Minimal, deterministic, DRY. Prefer composition over inheritance.
- Prefer TypeScript for new modules; JS only if migration cost outweighs benefits.
- No unused imports, no dead code. Each file must export used symbols.
- Functions: pure where possible; side effects centralized in services.
- Async: use async/await exclusively; avoid callbacks and promise chains without await.

3. File and Naming Conventions
- Filenames: kebab-case (e.g., pitch-list.tsx, create-pitch.handler.ts).
- React components & classes: PascalCase (PitchForm, SlideCard).
- Functions, variables, object keys: camelCase (createPitch, slideCount).
- Directories mirror domain/ERD and tech spec:
  - frontend/
    - src/
      - components/ (PascalCase files per component)
      - pages/
      - hooks/
      - services/ (API clients, model adapters)
      - stores/ (local/global state)
      - utils/
      - types/ (shared types and schemas)
  - backend/
    - src/
      - controllers/ (HTTP handlers)
      - services/ (business logic)
      - repositories/ (ERD-mapped persistence)
      - models/ (ORM schemas, mirrors ERD entity names)
      - routes/
      - schemas/ (request/response zod schemas)
      - libs/ (shared infra like logging, http client)
      - migrations/
- Files reflecting ERD entities must live under backend/src/models and backend/src/repositories with matching PascalCase entity names for classes and kebab-case filenames.

4. Error-Handling Doctrine
- Centralized typed errors. Use Error subclasses with shape: { code: string, message: string, details?: any, httpStatus?: number }.
- Structured logging (JSON) for all errors; sanitize PII and secrets.
- HTTP: controllers map errors to status codes and a minimal public error payload: { code, message }.
- Frontend: show user-safe messages; enrich logs with breadcrumbs and non-sensitive context.
- Retries: idempotent operations may retry with exponential backoff; non-idempotent operations must not retry automatically.
- Timeouts: all external calls (including model API calls) must have explicit timeouts and circuit-breaker thresholds.

5. Environment Variables and Secrets
- Validate ENV on startup; exit with non-zero code on critical misconfiguration.
- Never commit secrets to repo. Use .env for local development only; production secrets injected by runtime secret manager.
- Access through a single configuration module that types and documents each variable.
- Model API keys: server-only. Never expose model keys to the client.

6. Testing and Validation Rules
- Tests required for:
  - Unit: every service, util, and controller logic.
  - Integration: backend routes and repository interactions (use test DB).
  - Contract: frontend ↔ backend DTOs and backend ↔ model response schemas.
- Use Vitest for frontend and backend unit tests; use Playwright for critical E2E flows.
- Coverage: aim for >= 80% for new code; critical modules require 90%+.
- All generated code must include tests or a clear TODO with required test scaffold.
- Schemas: runtime validation for all network inputs/outputs using zod (or equivalent). Fail-safe on schema mismatch.

7. Model Interaction Guidelines
- All model calls must originate from backend services with strict input/output schemas.
- Prompt design:
  - Always include system, user, and assistant intent sections when crafting prompts.
  - Use explicit instructions for format (JSON schema) and provide examples.
  - Include token-budget estimate and expected max tokens in client config.
  - Enforce deterministic settings for agentic logic: temperature <= 0.2 for deterministic tasks; document deviations with justification.
- Response handling:
  - Validate model output against schema; reject and retry (bounded retries) when validation fails.
  - Log raw model responses for auditing, but store only redacted content when required.
- Rate limiting and quotas: implement server-side rate limits per user and per-API-key; backoff and queue when throttled.
- Safety: sanitize model outputs before rendering. Block or redact unsafe content by configured safety filters.

8. Prompt-Design Principles for Downstream Generation
- Every generation prompt must begin with: "Reference: /docs/agent-development.md".
- Prompts must include:
  - Goal statement (1 line).
  - Required file paths and exact modifications.
  - Strict output format (file diffs or full file content).
  - Tests required and success criteria.
- ADD compliance is authoritative: if a prompt conflicts with ADD rules, follow ADD and document the decision.

9. Code Style and Tooling
- Enforce with ESLint + Prettier. Use the repository's shared config. Automatic fixes via pre-commit hooks.
- Type annotations for public module boundaries.
- Lint errors are build failures in CI.
- Commit messages: imperative, reference ticket/PR id.

10. Output Requirements (for generated code)
- Every generated file must start with a single-line header comment:
  - "// ADD: /docs/agent-development.md"
- Generated changes must provide:
  - File path(s) modified/created.
  - Minimal diffs or full file contents.
  - Associated tests or test stubs.
- Generated code must be compile-ready (no missing imports) and lint-clean in the repository baseline.
- Small, focused commits: one logical change per file set.

11. Governance
- Consistency with this ADD overrides ad-hoc optimization.
- Any deviation requires a documented exception with technical justification and an owner.

Enforcement checklist (must pass before merge)
- [ ] All ENV validated on startup
- [ ] No client-side model keys
- [ ] Runtime schemas for all boundaries
- [ ] Tests covering new behavior
- [ ] ESLint/Prettier clean
- [ ] Header comment present in generated files
- [ ] Error handling conforms to doctrine

End of document.
