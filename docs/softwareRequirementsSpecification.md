# IDLE Arcade

## Softwareanforderungen

### 1. Einleitung

#### 1.1 Übersicht

Die Alleinstellungsmerkmale unserer Software sind die verschiedenen Räume, die erst nach und nach mit der Währung des vorheringen Raumes freigeschaltet werden können. Zudem handelt es sich um eine Kombination aus Idle und Arcade Games.

#### 1.2 Geltungsbereich

Dieses Dokument beschreibt die funktionalen und nicht-funktionalen Anforderungen des Systems IDLE Arcade. Nicht behandelt werden Implementierungsdetails, Datenbankdesigns sowie technische Architekturentscheidungen.

#### 1.3 Definitionen, Akronyme und Abkürzungen

Nach aktuellem Stand haben wir bisher noch keine speziellen Begriffe, Akronyme oder Abkürzungen, welche für das Verständnis dieses Dokumentes erforderlich wären.

#### 1.4 Referenzen

- UI-Mockups [15.10.2026, GitHub]: ![Bild des Mockups](mockups.png)
- UML-Verhaltensdiagramme [17.10.2026, GitHub]: ![Bild der UML-Verhaltensdiagramme](idle-arcade-use-cases.png)
- Aktivitätsdiagramme [25.10.2026, GitHub]: ![Bild der Aktivitätsdiagramme](activity-diagrams.png)
- UML-Klassendiagramme-Backend [29.10.2026, GitHub]: ![Bild des Backend-Klassendiagramms](class-diagrams/backend.png)
- UML-Klassendiagramme-Frontend [29.10.2026, GitHub]: ![Bild des Frontend-Klassendiagramms](class-diagrams/frontend.png)
- UML-Klassendiagramme-Persistence [29.10.2026, GitHub]: ![Bild des Persistence-Klassendiagramms](class-diagrams/persistence.png)

### 2. Funktionale Anforderungen

#### Übersicht

IDLE Arcade ist eine Kombination aus Idle- und Arcade-Spiel. Benutzer können verschiedene Räume freischalten, indem sie durch das Spielen Währungen verdienen. Jeder Raum enthält eigene Spielmechaniken und Highscorelisten.

#### 2.1 Projektsetup

- User Story: <https://github.com/idle-arcade/game/issues/20>
- Anmelde-Sequenzdiagramm: ![Bild der Anmeldesequenz](login-sequence-diagramm.svg)
  Das Sequenzdiagramm zeigt den Ablauf der An- und Abmeldung eines Nutzers. Bei der Anmeldung werden die eingegebenen Zugangsdaten geprüft und eine Sitzung erstellt, die über ein Sitzungs-Cookie gespeichert wird. Dieses Cookie wird bei späteren Anfragen zur Authentifizierung verwendet. Bei der Abmeldung wird die Sitzung beendet, das Cookie gelöscht und der Nutzer auf die Startseite weitergeleitet.
- Registrierungs-Sequenzdiagramm: ![Bild der Registrierungssequenz](registration-sequence-diagramm.svg)
  Das Sequenzdiagramm zeigt den Registrierungsprozess eines neuen Nutzers. Nach der Eingabe der Registrierungsdaten werden die Eingaben zunächst im Frontend und anschließend serverseitig geprüft. Anschließend legt Better Auth den Nutzer und die zugehörigen Authentifizierungsdaten in der Datenbank an. Nach erfolgreicher Registrierung wird direkt eine Sitzung erstellt und ein Sitzungs-Cookie an den Nutzer zurückgegeben.
- Aktivitätsdiagramm (Anmelden/Registrieren):
  - [activity-diagrams.png](activity-diagrams.png)
  - Das Aktivitätsdiagramm beschreibt den Ablauf der Anmeldung und Registrierung eines Spielers. Nach der Validierung der Eingaben werden die Zugangsdaten geprüft oder ein neues Benutzerkonto angelegt, anschließend wird eine Sitzung erstellt und der Spieler in den Darts-Raum weitergeleitet.
- Voraussetzungen:  
  - Das Git-Repository wurde erstellt.
  - Die Entwicklungsumgebung ist eingerichtet.
  - Die benötigten Frameworks und Abhängigkeiten sind verfügbar.
- Nachbedingungen:
  - Das Projekt ist lauffähig.
  - Die Grundstruktur der Anwendung wurde eingerichtet.
  - Benutzer können sich registrieren und anmelden.
- Geschätzter Aufwand: 16 Story points

#### 2.2 Raumnavigationen

- User Story: <https://github.com/idle-arcade/game/issues/23>
- Voraussetzungen:
  - Der Benutzer ist angemeldet.
  - Die Anwendung wurde erfolgreich gestartet.
  - Die verfügbaren Räume wurden geladen.
- Nachbedingungen: Eine Navigation zwischen den verschiedenen Spielräumen ist möglich.
  - Der Benutzer kann zwischen freigeschalteten Räumen wechseln.
  - Gesperrte Räume werden als nicht zugänglich angezeigt.
  - Der aktuell ausgewählte Raum wird dargestellt.
- Geschätzter Aufwand: gering

#### 2.3 Benutzeroberfläche der Spielräume

- User Story: <https://github.com/idle-arcade/game/issues/26>
- Aktivitätsdiagramm (Darts werfen und nachladen):
  - [activity-diagrams.png](activity-diagrams.png)
  - Das Aktivitätsdiagramm zeigt den Spielablauf beim Werfen von Darts. Nach jedem Wurf wird geprüft, ob ein Ziel getroffen wurde und die entsprechenden Münzen werden gutgeschrieben; sind alle Darts verbraucht, werden diese nach einer kurzen Wartezeit automatisch nachgeladen.
- Aktivitätsdiagramm (Upgrade kaufen(x1/x10)):
  - [activity-diagrams.png](activity-diagrams.png)
  - Das Aktivitätsdiagramm beschreibt den Kauf von Upgrades im Spiel. Dabei wird geprüft, ob genügend Münzen vorhanden sind, die Kosten werden vom Budget abgezogen und das Upgrade-Level entsprechend erhöht.
- Voraussetzungen: Es kann zu den einzelnen Spielräumen navigiert werden.
  - Der Benutzer befindet sich in einem Spielraum.
  - Die erforderlichen Spieldaten wurden geladen.
- Nachbedingungen: Die Spiele sind wie definiert verfügbar und können gespielt werden.
  - Die Spielfläche wird vollständig angezeigt.
  - Der Benutzer kann mit dem Spiel interagieren.
  - Spielergebnisse und Spielstände werden verarbeitet.
- Geschätzer Aufwand: 6 Story points

#### 2.4 Raumspezifische Highscores

- User Story: <https://github.com/idle-arcade/game/issues/29>
- Voraussetzungen:
  - Die Benutzeroberfläche enthält den Highscore-Button beziehungsweise das Highscore-Dropdown für das aktuelle Spiel.
  - Ein statischer Datensatz mit Dummy-Highscores ist vorhanden.
  - Das aktuelle Spiel kann über den vorhandenen Spielkontext identifiziert werden, damit der korrekte Titel (z. B. „Darts Highscores“) angezeigt werden kann.
  - Die Anwendung wurde erfolgreich geladen und die Benutzeroberfläche ist bedienbar.
- Nachbedingungen:
  - Das Highscore-Dropdown wurde entsprechend der Benutzeraktion geöffnet oder geschlossen.
  - Beim Öffnen wird eine Highscore-Tabelle für das aktuelle Spiel angezeigt.
  - Die Tabelle enthält die hinterlegten Dummy-Spielerdaten mit Name, Rang und Punktzahl.
  - Die ersten drei Einträge werden mit den Rangkennzeichnungen #1, #2 und #3 dargestellt.
  - Der Titel des Dropdowns entspricht dem aktuell geöffneten Spiel.
  - Der aktuelle Zustand des Dropdowns (eingeklappt oder ausgeklappt) wird in der Benutzeroberfläche korrekt dargestellt.
  - Die Highscore-Anzeige kann vom Spieler eingesehen werden, ohne die aktuelle Spielseite zu verlassen.
- Geschätzter Aufwand: 5 Story Points

#### 2.5 Mobile und Desktop Version

- User Story: <https://github.com/idle-arcade/game/issues/32>
- Voraussetzungen: Das Spiel ist in seiner Funktionalität fertig gestellt.
  - Die Kernfunktionalitäten des Spiels sind implementiert.
  - Die Benutzeroberfläche unterstützt responsive Darstellung.
- Nachbedingungen: Eine Verfügbarkeit als Mobile und Desktop Anwendung ist gewährleistet.
  - Die Anwendung kann auf mobilen Endgeräten genutzt werden.
  - Die Anwendung kann auf Desktop-Geräten genutzt werden.
  - Die Benutzeroberfläche passt sich automatisch an die Bildschirmgröße an.
- Geschätzter Aufwand: mittel

#### 2.6 Telemetriedaten und Nutzungsaktivitäten

- User Story: <https://github.com/idle-arcade/game/issues/52>
- Voraussetzungen:
  - Das Spiel ist bereitgestellt und lauffähig.
  - Die Telemetrie Infastruktur wurde eingerichtet.
  - Frontend- und Backend-Komponenten sind verfügbar und können Telemetriedaten erzeugen.
  - Ein Monitoring- bzw. Analyse-Syste, steht zur Speicherung und Auswertung der Daten bereit.
- Nachbedingungen:
  - Nutzungs- und Telemetriedaten des Spiels werden Automatisch erfasst.
  - Ereignisse aus Frontend und Backend werden an das Telemetriesystem übertragen.
  - Entwickler können auf Telemetriedaten und Statistiken zugreifen.
- Geschätzter Aufwand: 5 Story Points

#### 2.7 Spielevorschau entwickeln

- User Story: <https://github.com/idle-arcade/game/issues/81>
- Voraussetzungen:
  - Der aktuelle Entwicklungsstand des Spiels liegt im Repository vor.
  - Die Deployment-Infrastuktur für die Vorschauumgebung ist eingerichtet.
  - Die CI/CD-Pipeline ist konfiguriert und funktionsfähig.
  - Der Benutzer besitzt Zugriff auf die Vorschauumgebung.
- Nachbedingungen:
  - Eine aktuelle Vorschauversion des Spiels wurde erfolgreich bereitgestellt.
  - Die Vorschauversion ist über eine definierte URL erreichbar.
  - Änderungen am Projekt können automatisiert gebaut und bereitgestellt werden.
  - Benutzer können die bereitgestellte Vorschau des Spiels testen.
- Geschätzter Aufwand: 2 Story Points

#### 2.8 Multi-Währungssystem entwickeln

- User Story: <https://github.com/idle-arcade/game/issues/96>
- Voraussetzungen:
  - Das bestehende Währungssystem ist im Backend implementiert.
  - Die Datenbankstruktur für Spielerkonten und Kontostände ist vorhanden.
  - Die verwendeten Währungstypen und deren Anforderungen sind definiert.
  - Die Backend-API für Spielerdaten ist verfügbar.
- Nachbedingungen:
  - Mehrere Währungen werden vom Backend unterstützt.
  - Kontostände können für verschiedene Währungen separat gespeichert werden.
  - Währungsdaten sind über die API abrufbar.
  - Die korrekte Verarbeitung und Persistierung aller Währungen wurde verifiziert.
- Geschätzter Aufwand: viel

#### 2.9 Aktives Dartspiel und Upgrades implementieren

- User Story: <https://github.com/idle-arcade/game/issues/102>
- Voraussetzungen:
  - Das Darts-Minispiel ist konzeptionell definiert.
  - Mockups und UI-Entwürfe für das Spiel liegen vor.
  - Das bestehende Währungs- und Fortschrittssystem ist verfügbar.
  - Client- und Serveranwendung können Spielzustände synchronisieren.
- Nachbedingungen:
  - Benutzer können aktiv Darts spielen.
  - Upgrade-Käufe können durchgeführt und verarbeitet werden.
  - Einnahmen und Upgrade-Kosten werden korrekt berechnet.
  - Spielzustände werden zwischen Client und Server synchron gehalten.
Das Balancing und die Spiellogik wurden erfolgreich getestet.
- Geschätzter Aufwand: viel

#### 2.10 Mermaid-Diagramme automatische rendern

- User Story: <https://github.com/idle-arcade/game/issues/109>
- Voraussetzungen:
  - Eine Dokumentationspipeline ist vorhanden und funktionsfähig.
  - Mermaid-Diagramme werden im Projekt zur Dokumentation verwendet.
  - Die benötigten Rendering-Werkzeuge sind verfügbar und integrierbar.
  - Änderungen an der Dokumentation können automatisiert verarbeitet werden.
- Nachbedingungen:
  - Mermaid-Diagramme werden während der Dokumentationspipeline automatisch gerendert.
  - .mmd-Dateien werden in ein darstellbares Ausgabeformat umgewandelt.
  - Generierte Diagramme stehen in der Projektdokumentation zur Verfügung.
  - Die Rendering-Pipeline wurde erfolgreich getestet und verifiziert.
- Geschätzter Aufwand: 2 Story Points

#### 2.11

- User Story: <https://github.com/idle-arcade/game/issues/113>
- Voraussetzungen:
  - Das Projekt verfügt über definierte Regeln für Typecheck, Linting und Formatierung.
  - GitHub Actions ist für das Repository verfügbar.
  - Die erforderlichen Prüfwerkzeuge sind im Projekt eingerichtet.
  - Das Repository besitzt eine funktionsfähige CI-Infrastruktur.
- Nachbedingungen:
  - Typecheck-, Lint- und Formatierungsprüfungen werden automatisch ausgeführt.
  - Fehler werden im Rahmen der CI-Pipeline erkannt und gemeldet.
  - Fehlgeschlagene Prüfungen werden in GitHub Actions nachvollziehbar angezeigt.
  - Die Codequalität wird automatisiert überwacht.
- Geschätzter Aufwand: 2 Story Points

#### 2.12

- User Story: <https://github.com/idle-arcade/game/issues/116>
- Voraussetzungen:
  - Die native tRPC-API ist implementiert und erreichbar.
  - Die verfügbaren API-Endpunkte sind definiert.
  - Ein Mechanismus zur Generierung von Swagger/OpenAPI-Dokumentationen ist verfügbar.
  - Die Dokumentationsumgebung ist eingerichtet.
- Nachbedingungen:
  - Eine Swagger-Dokumentation für die tRPC-API wurde erstellt.
  - API-Endpunkte und Datenstrukturen sind dokumentiert.
  - Die Dokumentation kann über einen definierten Endpunkt aufgerufen werden.
  - Die Generierung und Bereitstellung der Dokumentation wurden erfolgreich verifiziert.
- Geschätzter Aufwand: 3 Story Points

#### 2.13 Automatisierte Abhängigkeitsupdates einrichten

- User Story: <https://github.com/idle-arcade/game/issues/130>
- Voraussetzungen:
  - Das Projekt verwendet externe Abhängigkeiten.
  - Schreib- und Verwaltungsrechte für die Repository-Konfiguration liegen vor.
  - Das Repository ist für automatisierte Pull Requests konfigurierbar.
  - Dependabot oder Renovate kann im Repository eingesetzt werden.
- Nachbedingungen:
  - Automatische Abhängigkeitsupdates werden regelmäßig erstellt.
  - Pull Requests für verfügbare Updates werden automatisch erzeugt.
  - Aktualisierungen können durch das Entwicklungsteam geprüft werden.
  - Der Prozess für die Wartung von Abhängigkeiten ist automatisiert.
- Geschätzter Aufwand: wenig

### 3. Nicht-funktionale Anforderungen

- Benuterfreundlichkeit
  - Das Programm sollte ohne Einarbeitung innerhalb von 5 bis 10 Minuten verstanden werden.
  - Fehlermeldungen sollen verständlich formuliert sein und gegebenenfalls konkrete Lösungsvorschläge enthalten.
- Zuverlässigkeit
  - Gespeicherte Spielstände dürfen nach einem Neustart nicht verloren gehen.
- Leistung
  - Spielaktionen sollen ohne wahrnehmbare Verzögerung ausgeführt werden.
  - Die Anwendung soll mehrere Spieler gleichzeitig unterstützen.
- Effizienz
  - Datenbankabfragen sollten minimiert werden, um Ressourcen effizient zu nutzen.
  - Nicht benötigte Daten sollen nicht dauerhaft im Speicher gehalten werden.
- Integrität
  - Spielstände dürfen nur von ihrem jeweiligen Nutzer verändert werden.
- Wartbarkeit
  - Der Code sollte den allgemeinen Prinzip der Wartbarkeit entsprechen.
- Flexibilität
  - Weitere Räume sollten ohne große Änderungen am Kernsystem hinzugefügt werden können.
- Sicherheit
  - Benutzereingaben sollen validiert und geprüft werden.
  - Unbefugte Benutzer dürfen nicht auf fremde Daten zugreifen.

### 4. Technische Einschränkungen

- Das Projekt setzt eine stabile Internetverbindung voraus.

- Benutzer benötigen einen aktuellen Webbrowser.

- Das System ist auf die Verwendung einer relationalen Datenbank zur Speicherung von Benutzerkonten, Spielständen und Rauminformationen angewiesen.

- Das Projekt verwendet ausschließlich Bibliotheken und Frameworks, deren Lizenzen eine kostenlose Nutzung im Rahmen des Projekts erlauben.

- Es wird angenommen, dass Benutzer wahrheitsgemäße Registrierungsdaten angeben und ihre Zugangsdaten vertraulich behandeln.

- Für die Authentifizierung und Autorisierung müssen Benutzer über ein eigenes Benutzerkonto verfügen.

- Die Verfügbarkeit des Systems hängt von der Erreichbarkeit des Servers und der Datenbank ab.
