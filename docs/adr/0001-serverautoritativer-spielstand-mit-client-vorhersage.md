# Serverautoritativer Spielstand mit Client-Vorhersage

## Kontext und Problemstellung

Im Darts-Raum wirft ein Spieler mehrmals pro Sekunde, kauft Upgrades und heuert automatische Spieler an, die
laufend Beers erzeugen. Aktionen sollen ohne spürbare Verzögerung wirken (Q1), der Server muss aber über den
gültigen Spielstand entscheiden (Q2) und darf nach Verbindungsabbrüchen nichts doppelt oder gar nicht buchen (Q3),
siehe [Qualitätsszenarien](../architecture.md) und [US17](https://github.com/idle-arcade/game/issues/193).
Wie bleiben Client und Server synchron, ohne Reaktionszeit gegen Integrität einzutauschen?

## Betrachtete Varianten

- Clientautoritativ
  Der Browser berechnet den Spielstand und speichert ihn regelmäßig auf dem Server.
- Serverautoritativ, eine Anfrage pro Aktion
  Jede Aktion geht einzeln an den Server; die Oberfläche wartet auf die Antwort.
- Serverautoritativ mit Client-Vorhersage
  Client und Server rechnen mit derselben deterministischen Simulation (`backend/src/shared/darts`). Der Client
  zeigt Ergebnisse sofort an und sendet Aktionen mit Zeitstempel gebündelt (alle 5 s, Käufe sofort). Der Server
  prüft und wiederholt sie und antwortet mit dem gültigen Stand.

## Entscheidung

Gewählte Variante: "Serverautoritativ mit Client-Vorhersage", denn nur sie erfüllt Q1, Q2 und Q3 zugleich.
Clientautoritativ scheidet aus, weil manipulierte Stände nicht erkennbar sind; eine Anfrage pro Aktion, weil
jede Aktion einen Roundtrip und eine Datenbanktransaktion kostet.

Muster in der Umsetzung:

- Gemeinsamer Domänenkern: Regeln und Simulation existieren einmal; `rulesVersion` weist veraltete Clients ab.
- Aktionen statt Ergebnisse: Der Server berechnet den Stand per Replay und prüft Zeit und Wurfrate auf
  Plausibilität.
- Idempotenz: Fortlaufende Sequenznummern; eine wiederholte Nummer erhält die gespeicherte Antwort.
- Sitzungsepoche: Jedes Laden startet eine neue Epoche und macht ältere Tabs ungültig.
- Zeilensperre pro Nutzer serialisiert gleichzeitige Anfragen.

## Status

Angenommen

## Konsequenzen

- Gut, weil Aktionen sofort sichtbar sind und trotzdem nur der Server den Stand festlegt.
- Gut, weil der Server Idle-Einnahmen bei Abwesenheit abrechnet und weitere Räume das Protokoll wiederverwenden können.
- Schlecht, weil die Simulation deterministisch bleiben muss und jede Regeländerung Client und Server zugleich betrifft.
- Schlecht, weil Abweichungen einen Abgleich auslösen, den Spieler als kurzes Zurückspringen sehen können.
- Schlecht, weil Wiederholungen, Epochen und Sperren zusätzliche Komplexität und Testaufwand bringen.
