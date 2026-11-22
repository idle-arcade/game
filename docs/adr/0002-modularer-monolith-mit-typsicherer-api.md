# Modularer Monolith mit typsicherer tRPC-API im Monorepo

## Kontext und Problemstellung

Ein kleines Team entwickelt Frontend und Backend parallel und will weitere Räume ergänzen, ohne Konten,
Währungen oder Synchronisation anzupassen (Q6). API-Änderungen sollen auffallen, bevor sie ausgeliefert werden.
Welche Struktur und welche API-Technik halten Änderungen günstig, ohne Betriebsaufwand zu erzeugen?

## Betrachtete Varianten

- Microservices mit REST
  Eigene Dienste für Konten, Währungen und Räume, je mit eigener Auslieferung.
- Monolith mit REST und OpenAPI
  Ein Backend; der Client erhält Typen über einen generierten OpenAPI-Client.
- Modularer Monolith mit tRPC im Monorepo
  Ein Backend mit Modulen pro Fachbereich (`auth`, `currency`, `darts`); Frontend und Backend liegen in einem
  npm-Workspace, der Client übernimmt die Typen direkt aus dem Router, Zod prüft Eingaben zur Laufzeit.

## Entscheidung

Gewählte Variante: "Modularer Monolith mit tRPC im Monorepo", denn sie trennt Fachbereiche, ohne verteilten
Betrieb zu verlangen, und meldet inkompatible API-Änderungen bereits bei `npm run typecheck` in der CI.
Microservices scheiden aus, weil Last und Teamgröße den Betriebsaufwand nicht rechtfertigen; REST mit OpenAPI,
weil Typen erst über einen zusätzlichen Generierungsschritt in den Client gelangen.

Designprinzipien:

- Hohe Kohäsion: Jeder Raum bündelt Regeln, Router und Persistenz im eigenen Modul.
- Lose Kopplung: Räume nutzen Währungen nur über `currency`; `room_sync` ist pro Raum über das Enum `Room`
  generisch.
- Validierung an der Grenze: Jede Prozedur prüft ihre Eingabe mit Zod; `protectedProcedure` setzt die Nutzer-ID
  aus der Sitzung.

## Status

Angenommen

## Konsequenzen

- Gut, weil eine Auslieferung (Docker Compose) genügt und Typfehler zwischen Client und Server in der CI auffallen.
- Gut, weil ein neuer Raum ein eigenes Modul ergänzt, statt bestehende zu ändern.
- Schlecht, weil das Backend nur als Ganzes skaliert; In-Memory-Zustand wie das Rate-Limit setzt eine Instanz voraus.
- Schlecht, weil tRPC an TypeScript-Clients bindet; die öffentliche Dokumentation braucht eine eigene OpenAPI-Ausgabe.
