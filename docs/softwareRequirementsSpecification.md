# IDLE Arcade
## Softwareanforderungen


### 1. Einleitung

#### 1.1 Übersicht
<!-- > Was sind die Verkaufsargumente bzw. Alleinstellungsmerkmale Ihrer Software? -->

> Die Alleinstellungsmerkmale unserer Software sind die verschiedenen Räume, die erst nach und nach mit der Währung des vorheringen Raumes freigeschaltet werden können. Zudem handelt es sich um eine Kombination aus Idle und Arcade Games. 

#### 1.2 Geltungsbereich
<!-- > Was wird in diesem Dokument behandelt (nicht behandelt)? Ist es für Ihr gesamtes System oder ein Subsystem? Deckt es sowohl funktionale als auch nicht-funktionale Anforderungen ab? (Werden Sie einige Anforderungen in ein anderes Dokument auslagern?) -->

> Dieses Dokument beschreibt die funktionalen und nicht-funktionalen Anforderungen des Systems IDLE Arcade. Nicht behandelt werden Implementierungsdetails, Datenbankdesigns sowie technische Architekturentscheidungen. 

#### 1.3 Definitionen, Akronyme und Abkürzungen
<!-- > Definitionen aller Begriffe, Akronyme und Abkürzungen, die für die ordnungsgemäße Interpretation dieses Dokuments erforderlich sind. -->

Nach aktuellem Stand haben wir bisher noch keine speziellen Begriffe, Akronyme oder Abkürzungen, welche für das Verständnis dieses Dokumentes erforderlich wären.

#### 1.4 Referenzen
<!-- > Eine vollständige Liste aller referenzierten Dokumente. Jedes Dokument sollte anhand von Titel, Datum und Veröffentlichungsorganisation identifiziert werden. Sie können auch Hyperlinks einfügen, um die Referenzen bequem zu öffnen. -->

* UI-Mockups [15.10.2026, GitHub]: https://github.com/idle-arcade/game/blob/main/docs/IDLE%20Arcade.excalidraw 

### 2. Funktionale Anforderungen
<!-- > Dieser Abschnitt enthält alle Softwareanforderungen in einem ausreichenden Detaillierungsgrad, damit Designer ein System entwerfen können, das diese Anforderungen erfüllt, und Tester testen können, ob das System diese Anforderungen erfüllt.
> Dieser Abschnitt ist normalerweise nach Funktionen geordnet, es können jedoch auch alternative Gliederungen geeignet sein, beispielsweise die Gliederung nach Benutzer oder die Gliederung nach Subsystem.

> [HINWEIS:]
> Sie können Links zu Ihren UML-Diagrammen und User Stories oder die Bezeichnungen der User Stories in dieses Dokument einfügen. -->



#### 2.1 Übersicht
<!-- > Eine kurze Beschreibung der Funktionalität Ihrer Anwendung.
> Fügen Sie ein oder mehrere **UML-Anwendungsfalldiagramme** und die erforderliche Beschreibung hinzu, um die wichtigsten Anwendungsfälle Ihrer Anwendung wiederzugeben. -->

<!-- > Zuerst wird das Projekt aufgesetzt, anschließend wird die Navigation zwischen den einzelnen Räumen realisiert. Darauf aufbauen wird die Benutzeroberfläche des Dartspiels implementiert. Weiter geht es mit den Raum spezifischen Highscores. Gegen Ende ist noch eine mobile und Desktop Version des Spiels geplant.  
> Für die folgenden Features gibt es ein gemeinsames Mockup, das ist zu finden unter docs/IDLE Arcade.excalidraw -->

> IDLE Arcade ist eine Kombination aus Idle- und Arcade-Spiel. Benutzer können verschiedene Räume freischalten, indem sie durch das Spielen Währungen verdienen. Jeder Raum enthält eigene Spielmechaniken und Highscorelisten.

#### 2.2 Projektsetup
<!-- > Spezifizieren Sie diese Funktion/diesen Anwendungsfall durch: -->
<!-- > - **Voraussetzungen**. *Eine Voraussetzung für einen Anwendungsfall ist der Zustand des Systems, der vorliegen muss, bevor ein Anwendungsfall ausgeführt wird.* -->
<!-- > - **Nachbedingungen**. *Eine Nachbedingung eines Anwendungsfalls ist eine Liste möglicher Zustände, in denen sich das System unmittelbar nach Abschluss eines Anwendungsfalls befinden kann.* -->
> - User Story: https://github.com/idle-arcade/game/issues/20
> - **UML-Verhaltensdiagramme** und notwendige Textspezifikation
> - Voraussetzungen:  
>   - Das Git-Repository wurde erstellt.
>   - Die Entwicklungsumgebung ist eingerichtet.
>   - Die benötigten Frameworks und Abhängigkeiten sind verfügbar.
> - Nachbedingungen: 
>   - Das Projekt ist lauffähig.
>   - Die Grundstruktur der Anwendung wurde eingerichtet.
>   - Benutzer können sich registrieren und anmelden.
> - Geschätzter Aufwand: 16 Story points

#### 2.3 Raumnavigationen
> Spezifizieren Sie diese Funktion/diesen Anwendungsfall durch:
> - User Story: https://github.com/idle-arcade/game/issues/23
> - **UML-Verhaltensdiagramme** und notwendige Textspezifikation
> - Voraussetzungen:
>   - Der Benutzer ist angemeldet.
>   - Die Anwendung wurde erfolgreich gestartet.
>   - Die verfügbaren Räume wurden geladen.
> - Nachbedingungen: Eine Navigation zwischen den verschiedenen Spielräumen ist möglich.
>   - Der Benutzer kann zwischen freigeschalteten Räumen wechseln.
>   - Gesperrte Räume werden als nicht zugänglich angezeigt.
>   - Der aktuell ausgewählte Raum wird dargestellt. 
> - Geschätzter Aufwand: mittel 

#### 2.4 Benutzeroberfläche der Spielräume
> Spezifizieren Sie diese Funktion/diesen Anwendungsfall durch:
> - User Story: https://github.com/idle-arcade/game/issues/26
> - **UML-Verhaltensdiagramme** und notwendige Textspezifikation
> - Voraussetzungen: Es kann zu den einzelnen Spielräumen navigiert werden.
>   - Der Benutzer befindet sich in einem Spielraum.
>   - Die erforderlichen Spieldaten wurden geladen.
> - Nachbedingungen: Die Spiele sind wie definiert verfügbar und können gespielt werden.
>   - Die Spielfläche wird vollständig angezeigt.
>   - Der Benutzer kann mit dem Spiel interagieren.
>   - Spielergebnisse und Spielstände werden verarbeitet.
> - Geschätzer Aufwand: mittel

#### 2.5 Raumspezifische Highscores
> Spezifizieren Sie diese Funktion/diesen Anwendungsfall durch:
> - User Story: https://github.com/idle-arcade/game/issues/29
> - **UML-Verhaltensdiagramme** und notwendige Textspezifikation
> - Voraussetzungen: Die einzelnen Räume sind verfügbar, das Spiel funktioniert im allgemeinen.
>   - Der ausgewählte Spielraum ist verfügbar.
>   - Der Benutzer hat mindestens ein Spiel abgeschlossen.
>   - Eine Verbindung zur Datenbank besteht.
> - Nachbedingungen: Jeder Raum erhält eine eigene Highscore Anzeige, die den besten Spieler des Raumes anzeigt. Diese werden in der Datenbank gespeichert. 
>   - Die Highscoreliste des jeweiligen Raums wird angezeigt.
>   - Neue Bestwerte werden gespeichert.
>   - Die Rangliste wird aktualisiert.
> - Geschätzter Aufwand: mittel

#### 2.6 Mobile und Desktop Version 
> Spezifizieren Sie diese Funktion/diesen Anwendungsfall durch:
> - User Story: https://github.com/idle-arcade/game/issues/32
> - **UML-Verhaltensdiagramme** und notwendige Textspezifikation
> - Voraussetzungen: Das Spiel ist in seiner Funktionalität fertig gestellt.
>   - Die Kernfunktionalitäten des Spiels sind implementiert.
>   - Die Benutzeroberfläche unterstützt responsive Darstellung.
> - Nachbedingungen: Eine Verfügbarkeit als Mobile und Desktop Anwendung ist gewährleistet. 
>   - Die Anwendung kann auf mobilen Endgeräten genutzt werden.
>   - Die Anwendung kann auf Desktop-Geräten genutzt werden.
>   - Die Benutzeroberfläche passt sich automatisch an die Bildschirmgröße an.
> - Geschätzter Aufwand: mittel

 

### 3. Nicht-funktionale Anforderungen

<!-- > [WICHTIG:]
> Es ist nicht notwendig, alle der folgenden Kategorien abzudecken. Konzentrieren Sie sich auf das, was Sie in Ihrem Projekt umsetzten werden.
> Wenn einige nicht-funktionale Anforderungen als User Stories in Ihrem Backlog beschrieben werden, fügen Sie deren **Links** in diesem Abschnitt hinzu oder beliebige Informationen, die den Leser bei der Suche nach ihnen in Ihrem Backlog unterstützen, z.B. die **Bezeichnung** der relevanten User Story.

> Kategorien: Benutzerfreundlichkeit, Zuverlässigkeit, Leistung, Effizienz, Integrität, Wartbarkeit, Flexibilität, Testbarkeit, Wiederverwendbarkeit, Sicherheit. -->

* Benuterfreundlichkeit
    * Das Programm sollte ohne Einarbeitung innerhalb von 5 bis 10 Minuten verstanden werden.
    * Fehlermeldungen sollen verständlich formuliert sein und gegebenenfalls konkrete Lösungsvorschläge enthalten.
* Zuverlässigkeit
    * Gespeicherte Spielstände dürfen nach einem Neustart nicht verloren gehen.
* Leistung
    * Spielaktionen sollen ohne wahrnehmbare Verzögerung ausgeführt werden.
    * Die Anwendung soll mehrere Spieler gleichzeitig unterstützen.
* Effizienz
    * Datenbankabfragen sollten minimiert werden, um Ressourcen effizient zu nutzen.
    * Nicht benötigte Daten sollen nicht dauerhaft im Speicher gehalten werden.
* Integrität
    * Spielstände dürfen nur von ihrem jeweiligen Nutzer verändert werden.
* Wartbarkeit
    * Der Code sollte den allgemeinen Prinzip der Wartbarkeit entsprechen.
* Flexibilität
    * Weitere Räume sollten ohne große Änderungen am Kernsystem hinzugefügt werden können.
* Sicherheit
    * Benutzereingaben sollen validiert und geprüft werden.
    * Unbefugte Benutzer dürfen nicht auf fremde Daten zugreifen.

### 4. Technische Einschränkungen
<!-- > Geben Sie alle wichtigen Einschränkungen, Annahmen oder Abhängigkeiten an, z. B. alle Einschränkungen darüber, welcher Servertyp verwendet werden soll, welche Art von Open-Source-Lizenz eingehalten werden muss usw. -->
* Das Projekt setzt eine stabile Internetverbindung voraus.

* Benutzer benötigen einen aktuellen Webbrowser.

* Das System ist auf die Verwendung einer relationalen Datenbank zur Speicherung von Benutzerkonten, Spielständen und Rauminformationen angewiesen.

* Das Projekt verwendet ausschließlich Bibliotheken und Frameworks, deren Lizenzen eine kostenlose Nutzung im Rahmen des Projekts erlauben.

* Es wird angenommen, dass Benutzer wahrheitsgemäße Registrierungsdaten angeben und ihre Zugangsdaten vertraulich behandeln.

* Für die Authentifizierung und Autorisierung müssen Benutzer über ein eigenes Benutzerkonto verfügen.

* Die Verfügbarkeit des Systems hängt von der Erreichbarkeit des Servers und der Datenbank ab.