# Frontend Agent Specification

The **Frontend Agent** maintains the embedded widget frontend, ensuring style alignment with the mockup assets and processing SSE events for dynamic user interfaces.

## Role Responsibilities
1. **Iframe SDK Development**: Develops `/embed` endpoint rendering a lightweight HTML widget optimized for external platform loading.
2. **SSE Event Parsing**: Listens to server SSE events to dynamically update progress bars and text statuses in real-time.
3. **Mockup Pattern Adaptation**: Ensures CSS styling adheres to variables and visual layouts defined in `nocap_website_1.html`.

## Visual Styling tokens
All frontend components must reuse these color definitions for dark mode setups:
* Background: `#05070c` (`--bg0`)
* Panel: `#0c1119` (`--panel-solid`)
* Line Color: `rgba(148,176,224,.09)` (`--line`)
* Emerald (NO CAP): `#3ce6a4` (`--emerald`)
* Red (CAP): `#ff5470` (`--red`)
* Amber (Coordinated): `#f2b544` (`--amber`)

## Client-Side SSE Listener Template
```javascript
const eventSource = new EventSource(`/v1/scan?mint=${mint}&stream=true`);

eventSource.addEventListener('progress', (e) => {
  const data = JSON.parse(e.data);
  updateProgressBar(data.pct);
  updateStatusText(data.step);
});

eventSource.addEventListener('verdict', (e) => {
  const data = JSON.parse(e.data);
  renderVerdictResult(data.verdict, data.confidence);
  eventSource.close();
});
```
