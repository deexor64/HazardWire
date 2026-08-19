# AI-Powered Hazard Reporting & Routing System

## 1. Project Goal & Intent

The current infrastructure management system in Sri Lanka faces a critical bottleneck: fragmented jurisdiction. When a citizen spots a civic hazard—such as a massive pothole, a fallen powerline, or a burst water pipe—it is rarely clear which government body is responsible for fixing it.

The goal of this project is to build an intelligent, centralized reporting platform. By leveraging Retrieval-Augmented Generation (RAG) and Large Language Models (LLMs), the system will automatically analyze citizen reports, retrieve real-time geographical and legal context, and instantly route the hazard to the correct authority (e.g., RDA, Municipal Council, CEB, or NWSDB). The intent is to reduce bureaucratic delays, improve civic maintenance response times, and provide a transparent, public-facing map of community hazards.

## 2. Core Use Cases

The platform is designed to handle multiple types of everyday civic and environmental hazards:

* **Road Infrastructure Damage:** Automatically distinguishing between a pothole on an A-Class highway (routed to the Road Development Authority) versus a local neighborhood road (routed to the local Municipal Council or Pradeshiya Sabha).
* **Utility Failures:** Identifying burst mains (routed to NWSDB) or fallen transformers/sparking powerlines (routed to CEB/LECO).
* **Environmental Hazards:** Reporting illegal garbage dumping, blocked drainage systems, or fallen trees blocking traffic (routed to Local Authorities or Traffic Police).
* **Natural Disaster Early Warnings:** Flagging localized flooding or landslides and pushing data to the Disaster Management Centre (DMC).

## 3. System Architecture & Components

The architecture relies on a RAG + MCP pipeline.

### The Knowledge Base (Vector Database)

The system requires a foundation of rules to make accurate decisions. We will create and embed text documents detailing the mandates of Sri Lankan authorities:

* **RDA:** Maintains Class A, Class B roads, and Expressways.
* **Local Authorities (CMC, Urban Councils):** Maintains Class C, Class D, and unclassified rural roads, local drainage, and waste.
* **NWSDB / CEB:** Handles water mains and electricity infrastructure respectively.

### Dynamic Data APIs

* **Geographic Context:** OpenStreetMap (OSM) Nominatim API translates the user's GPS coordinates into road classifications (e.g., checking if the incident is on the A1 Highway or a minor street).
* **Historical Context:** The application database retrieves recent reports within a 2km radius to check for duplicate reports or escalating multi-hazard events (e.g., a burst pipe causing a pothole).

## 4. Execution Workflow

1. **Data Ingestion:**
A user submits a hazard via the web interface. The payload includes a text description (e.g., "Huge water leak cracking the road"), GPS coordinates, and optionally images.


2. **Context Retrieval (RAG):**
The backend pings OpenStreetMap for the road type and queries the Vector Database to retrieve the official jurisdiction rules that match the keywords and location data.


3. **AI Synthesis & Prioritization:**
The user's report, the geographic data, and the retrieved authority rules are packaged into a prompt. The LLM acts as a dispatcher: it identifies the primary hazard, selects the correct authority, assigns a severity score (1-5), and formats a structured JSON response.


4. **Routing & Logging:**
The backend parses the LLM's JSON output. The incident is logged onto a public-facing Leaflet map, and a formatted alert is dispatched to the assigned authority's dashboard or email system.


## 5. Recommended Tech Stack & Software Tools

**Frontend and UI:** Vitejs
**Backend and API:** FastAPI
**RAG Orchestration:** LangChain (Python) | Simplifies the process of chaining the prompt, querying the vector database, and calling the LLM.
**Vector Database:** Pinecone or Supabase (pgvector) | Stores and quickly searches the text embeddings of the authority jurisdiction rules.
**Embedding Model:** `text-embedding-3-small` (OpenAI) or `text-embedding-004` (Gemini) | Converts the Sri Lankan authority rule text files into vector numbers for semantic search.
**Core LLM:** Gemini 1.5 Flash or GPT-4o-mini | Reads the retrieved context and generates the final structured JSON hazard report. Chosen for high speed and low cost.
**Geolocation API:** OpenStreetMap (Nominatim) | Free API to reverse-geocode coordinates and determine specific road classes in Sri Lanka.

## 6. Challenges

* Users must be provided with minimal to no login interface to quickly submit a report.
