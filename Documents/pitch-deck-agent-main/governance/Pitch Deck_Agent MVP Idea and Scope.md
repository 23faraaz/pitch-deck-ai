# **Pitch Deck Agent – MVP Idea and Scope**

**Concept**  
Pitch Deck Agent is a lightweight, local-first *AI deck builder* that transforms a four-line creative brief into an investor-ready 10-slide presentation.  
It runs fully offline after setup, translating idea, audience, tone, and goal into structured slide text and image prompts, exportable as editable `.pptx` and printable `.pdf` files.

**Core Loop**  
Input → Generate → Preview → Export

**Key Features**

* **Input:** Simple React form collecting *idea, audience, tone, goal*

* **Generation:** Node orchestrator formats prompt → Gemini API returns structured JSON `{slides:[…]}`

* **Preview:** Markdown renderer displays full deck with slide titles and bullet points

* **Export:** pptxgenjs builds editable PowerPoint; pdf-lib compiles printable PDF

* **Template Editor:** Direct JSON editing for system + user prompts

* **Persistence:** Decks stored locally under `/storage/decks` with timestamped JSON

**Scope cut**

* No cloud sync, multi-user support, or collaboration layer  
* No image rendering or embedded visuals  
* No external database or telemetry  
* Local `.env` stores `GEMINI_API_KEY` — never transmitted  

**Success criteria**

* Deck generation ≤ 10 s  
* Export ≤ 5 s  
* Codebase ≤ 1 000 LOC  
* Fully operable and editable without prior training  

---
