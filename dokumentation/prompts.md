# Vectorapp

Diese Dokumentation enthält die Nutzer-Prompts und die jeweiligen
abschließenden Antworten.

## 1. Dateiformat und technische Grundlage

### Prompt

Ich möchte eine kleine Web-App erstellen, wirklich mit sehr kleinem Umfang. Ich muss
lediglich ein 3D-Modell hochladen, das ich in Vectorworks erstellt habe. Wenn andere die
Website besuchen, sollen sie das Modell drehen und heranzoomen sowie aus verschiedenen
Perspektiven betrachten können. Das ist der einzige Zweck der Website.

Welches Dateiformat wäre dafür beim Export aus Vectorworks am besten geeignet, und was
würde ich sonst noch benötigen?

Nenne diese Aufgabe „Vectorapp“.

### Antwort

Aufgabenname: **Vectorapp**

Das beste Format für die Website ist **GLB**, die binäre Ein-Datei-Variante von glTF.
Sie kann Geometrie, Materialien, Texturen und die Szenenstruktur enthalten und ist für
die effiziente Bereitstellung in Echtzeitanwendungen wie Web-Viewern ausgelegt.
[Khronos beschreibt glTF/GLB als ein 3D-Laufzeitformat](https://www.khronos.org/gltf/).

#### Empfohlener Arbeitsablauf

Vectorworks bietet in seinem allgemeinen Exportablauf keinen normalen eigenständigen
GLB-Export. Die glTF-Unterstützung befindet sich hauptsächlich im Spotlight-spezifischen
MVR-Format. Deshalb:

1. Exportiere in Vectorworks über `Datei → Export → FBX exportieren (nur 3D)` als
   **FBX**.
2. Importiere die FBX-Datei in die kostenlose Anwendung **Blender**.
3. Prüfe Maßstab, Ausrichtung, Materialien, Texturen und Flächennormalen.
4. Exportiere aus Blender als **glTF 2.0 → GLB**.

FBX ist die beste Zwischenlösung, weil Vectorworks die Szenenorganisation beibehalten
kann und Optionen zur Gliederung der exportierten Geometrie nach Textur, Klasse oder
Ebene bietet.
[Dokumentation zum FBX-Export aus Vectorworks](https://app-help.vectorworks.net/2024/eng/VW2024_Guide/Export/Exporting%20in_FBX_format.htm).

OBJ würde bei einem sehr einfachen Modell ebenfalls funktionieren, ist für Materialien
und Szenenorganisation aber weniger praktisch. STL, 3DS und FBX sollten nicht als
endgültiges Website-Format verwendet werden.

#### Was die Website benötigt

Für diesen Umfang brauchst du weder React noch eine Datenbank oder ein Backend. Du
benötigst lediglich:

- eine optimierte Datei `model.glb`,
- eine kleine HTML-/CSS-Seite,
- Googles Open-Source-Komponente `<model-viewer>`,
- statisches Webhosting wie GitHub Pages, Cloudflare Pages, Netlify oder Vercel,
- optional ein Vorschaubild, das während des Ladens des Modells angezeigt wird.

`<model-viewer>` unterstützt bereits das Drehen per Maus und Touch, Zoomen, Verschieben,
die Kamerapositionierung und optionales automatisches Drehen.
[Die Beispiele zu Kamerasteuerungen zeigen diese Interaktionen](https://modelviewer.dev/examples/stagingandcameras/).

#### Wichtige Vorbereitungen

Vor der Veröffentlichung:

- Entferne ausgeblendete und unnötige Vectorworks-Objekte.
- Verwende eine mittlere Export-Detailstufe – CAD-Modelle können eine enorme Anzahl an
  Polygonen erzeugen.
- Wandle prozedurale Vectorworks-Materialien bei Bedarf in normale Bildtexturen um.
- Verkleinere übermäßig große Texturen, üblicherweise auf 1K oder 2K.
- Strebe nach Möglichkeit eine GLB-Datei mit **höchstens etwa 10–20 MB** an; größere
  Architekturmodelle benötigen möglicherweise Mesh- und Texturkomprimierung.
- Teste sowohl auf einem Smartphone als auch auf einem Desktop-Rechner.

Wenn du das Modell nur teilen möchtest und keine eigene Website benötigst, können
Vectorworks Cloud Services Dateien bereits im Browser zugänglich machen.
[Überblick über Vectorworks Cloud Services](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/UsingHelp/Additional_Vectorworks_services.htm).
Für eine eigene Domain und einen minimal gebrandeten Viewer ist die Kombination aus GLB
und `<model-viewer>` die sauberste Lösung.

## 2. Kleine eigene Website einrichten

### Prompt

Ich weiß, aber ich hätte gern eine schnelle, einfache und kleine eigene Website. Kannst
du in diesem Repository alles vorbereiten, was ich brauche? Ich möchte sie lokal
ausführen, bevor ich sie irgendwo hoste.

### Antwort

Vectorapp ist vollständig eingerichtet und kann ausgeführt werden.

Enthalten sind:

- ein responsiver, bildschirmfüllender 3D-Viewer,
- Steuerungen zum Drehen, Zoomen, Verschieben, Zurücksetzen und automatischen Drehen,
- Drag-and-drop sowie eine Dateiauswahl zum lokalen Testen von `.glb`-Dateien,
- automatisches Laden des gehosteten Modells aus `public/models/model.glb`,
- Ladefortschritt, Fehlerbehandlung und ein mobiles Layout,
- eine Vite-Konfiguration für den Produktions-Build,
- Einrichtungs- und Konvertierungsanweisungen für Vectorworks in
  [README.md](/home/tapioka/yas/README.md).

Starte die App mit:

```bash
npm run dev
```

Öffne danach `http://localhost:5173`.

Du kannst sofort eine GLB-Datei auswählen oder hineinziehen. Um sie zum dauerhaften
Website-Modell zu machen, lege sie hier ab:

```text
public/models/model.glb
```

Der Produktions-Build mit `npm run build` läuft erfolgreich durch. Die wichtigsten
Implementierungsdateien sind [index.html](/home/tapioka/yas/index.html),
[main.js](/home/tapioka/yas/src/main.js) und
[styles.css](/home/tapioka/yas/src/styles.css).

## 3. Einen Modellzustand über einen Link teilen

### Prompt

Sobald ein Modell eingefügt wurde und betrachtet werden kann, müsste dieser Zustand mit
anderen teilbar sein. Andere sollten also einfach einen Link erhalten und dann das von
mir eingefügte Modell sehen können. Ist das derzeit möglich? Sieht nicht danach aus.

### Antwort

Richtig: Dateien, die über **Open GLB** oder per Drag-and-drop geöffnet werden, sind nur
vorübergehende lokale Browserdateien. Sie werden über eine private `blob:`-URL geladen,
also weder hochgeladen noch teilbar gemacht.

Das aktuelle Grundgerüst unterstützt das Teilen nur mit diesem Ablauf:

1. Lege das Modell unter `public/models/model.glb` ab.
2. Erstelle den Build und veröffentliche die Website.
3. Teile die URL der Startseite.

Das eignet sich gut, wenn die Website immer nur ein Modell zeigt.

Wenn du direkt auf der Website „Modell hochladen → teilbaren Link erhalten“ möchtest,
brauchen wir drei zusätzliche Komponenten:

- dauerhaften Objektspeicher für hochgeladene GLB-Dateien,
- einen kleinen Upload-Endpunkt,
- eine modellspezifische URL wie `/view/abc123` oder `/?model=abc123`.

Dafür wäre ein kleines Backend oder ein verwalteter Speicherdienst erforderlich; eine
rein statische Website kann Browser-Uploads nicht dauerhaft speichern. Ich kann das
ergänzen, aber die Umsetzung hängt davon ab, wo die Website gehostet werden soll.

## 4. Ein einziges Modell fest in die Website einbinden

### Prompt

Vercel klingt gut.

Andererseits weiß ich sicher, dass ich immer nur ein einziges Modell mit anderen teilen
werde, niemals mehr als dieses eine. Können wir dieses Modell nicht in die Website
einbauen, sodass andere Besucher immer genau dieses Modell sehen?

### Antwort

Ja – für ein einziges Modell ist das genau der richtige Ansatz, und das aktuelle
Grundgerüst unterstützt ihn bereits.

Lege deine GLB-Datei hier ab:

```text
public/models/model.glb
```

Führe anschließend Folgendes aus:

```bash
npm run dev
```

Vectorapp lädt dieses Modell automatisch. Nach der Veröffentlichung auf Vercel sieht
jeder Besucher der Haupt-URL der Website dasselbe Modell.

Die GLB-Datei bleibt ein statisches Website-Asset, anstatt in den HTML-Code eingebettet
zu werden. Das ist vorzuziehen, weil Browser sie effizient laden und zwischenspeichern
können. Eine Datenbank, eine Upload-API, ein Konto oder ein separater Speicherdienst sind
nicht erforderlich.

Die vorhandene Drag-and-drop-Funktion ist lediglich eine praktische lokale Vorschau.
Sobald du die endgültige GLB-Datei bereitstellst, können wir auch diese Upload-Oberfläche
entfernen, sodass Besucher nur den fertigen Viewer sehen. Um das Modell später zu
ersetzen, müsste lediglich `model.glb` ausgetauscht und die Website erneut veröffentlicht
werden.

## 5. Flache Beleuchtung verbessern

### Prompt

Es funktioniert. Allerdings sieht die Beleuchtung ziemlich flach aus. Kann ich das auf
Seiten der App ändern, oder liegt es am Modell? In Vectorworks sieht das Modell deutlich
besser beleuchtet aus.

### Antwort

Beides spielt eine Rolle, aber in diesem Fall lässt sich die größte unmittelbare
Verbesserung auf Seiten der App erzielen.

Vectorapp hat derzeit kein `environment-image`, daher verwendet `<model-viewer>` seine
integrierte neutrale Beleuchtung. Diese Beleuchtung ist absichtlich aus allen Richtungen
gleichmäßig, was Architekturmodelle oft flach aussehen lässt. Eine HDR-Umgebungskarte
würde gerichtetes Licht, Reflexionen, Kontrast und eine überzeugendere Materialwirkung
liefern, ohne den sichtbaren Hintergrund zu verändern.
[Offizielle Dokumentation zur Beleuchtung](https://modelviewer.dev/examples/lightingandenv/).

Ich habe außerdem deine tatsächliche GLB-Datei untersucht:

- Sie enthält **keine Lichtquellen**.
- Sie hat 17 Materialien und 28 Texturen.
- Sie enthält keine Normal-, Okklusions- oder Metall-/Rauheitskarten.
- Vierzehn Materialien sind als emissiv markiert.

Die Beleuchtung aus Vectorworks und ein großer Teil der Renderworks-Materialwirkung
wurden daher beim Export nicht übernommen.

Eine erste Verbesserung auf App-Seite könnte etwa so aussehen:

```html
<model-viewer
  environment-image="/environments/studio.hdr"
  tone-mapping="agx"
  exposure="1.05"
  shadow-intensity="1.4"
  shadow-softness="0.5"
></model-viewer>
```

Die HDR-Umgebung ist dabei der wichtigste Teil; Belichtung und Schatten sind
nachgeordnete Anpassungen. `<model-viewer>` unterstützt HDR- oder UltraHDR-Umgebungsbilder
und kann sie zur Beleuchtung verwenden, ohne sie als Hintergrund anzuzeigen.
[API-Referenz zur Beleuchtung](https://modelviewer.dev/docs/index.html#entrydocs-lightingandenv-attributes).

Wenn das weiterhin nicht ausreicht, sollten die Materialien des Modells in Blender
verbessert werden – insbesondere Rauheit und Normal Maps. Außerdem sollten emissive
Einstellungen von Oberflächen entfernt werden, die normal auf Licht reagieren sollen.
Die Darstellung wird den Offline-Renderer von Vectorworks nicht exakt reproduzieren,
aber eine gute Studio-HDR-Umgebung sollte einen deutlichen Unterschied bewirken.

## 6. Alle möglichen Beleuchtungsverbesserungen umsetzen

### Prompt

Bitte nimm alle Änderungen vor, die auf Seiten der App möglich sind. Danach werde ich
mir den Modellexport genauer ansehen.

### Antwort

Alle sicheren appseitigen Beleuchtungsverbesserungen wurden umgesetzt:

- Eine gerichtete Studio-HDRI von
  [Poly Haven](https://polyhaven.com/a/studio_small_03) wurde unter CC0 lokal
  eingebunden.
- AgX wurde als Standard für das Tone Mapping festgelegt.
- Belichtung und Kontaktschatten wurden abgestimmt.
- Ein kontrastierender, hellgrauer Hintergrund wurde hinzugefügt.
- Ein **Beleuchtungs**-Panel wurde ergänzt mit:
  - Studio- oder neutraler Umgebung,
  - AgX, ACES oder Neutral als Tone Mapping,
  - Helligkeitsregelung,
  - hellgrauem, hellem oder dunklem Hintergrund.

Ich habe außerdem Post-Processing für Umgebungsverdeckung getestet. Es überbelichtete
jedoch diese konkrete GLB-Datei, weshalb ich es ausgeschlossen habe, anstatt die
Darstellung zu verschlechtern.

Das Ergebnis wurde in Chrome visuell geprüft und `npm run build` läuft erfolgreich
durch. Starte `npm run dev` neu und verwende die neue Schaltfläche **Beleuchtung**, um
die Einstellungen zu vergleichen. Die Umsetzung befindet sich in
[index.html](/home/tapioka/yas/index.html) und
[main.js](/home/tapioka/yas/src/main.js).

## 7. Niedrigere Mindesthelligkeit

### Prompt

Können wir den Beleuchtungsregler so ändern, dass er eine noch niedrigere Helligkeit
unterstützt? Das Minimum liegt jetzt bei 0,55; ich möchte es auf 0,10 absenken.

### Antwort

Der Mindestwert des Helligkeitsreglers wurde von `0.55` auf `0.10` geändert. Der
Produktions-Build läuft erfolgreich durch.

## 8. Bedienoberfläche vereinfachen

### Prompt

- Entferne das automatische Drehen.
- Entferne die Option „Environment“ aus dem Beleuchtungsmenü und verwende „Studio“ als
  Grundlage.
- Lege „Neutral“ als Standardoption für das Tone Mapping fest.
- Lege die Helligkeit standardmäßig auf 0,20 fest.
- Entferne das Hintergrundmenü und verwende standardmäßig „Dark“.
- Entferne die obere Zeile, in der „Vectorapp“, „model.glb“ und „Open GLB“ stehen.

### Antwort

Alle gewünschten Änderungen wurden umgesetzt:

- Das automatische Drehen wurde entfernt.
- Die Umgebung wurde fest auf Studio eingestellt.
- Neutral wurde als Standard für das Tone Mapping festgelegt.
- Die Standardhelligkeit wurde auf `0.20` gesetzt.
- Der Hintergrund wurde fest auf Dunkel eingestellt.
- Die gesamte obere Navigationszeile wurde entfernt.
- Das Beleuchtungs-Panel wurde entsprechend vereinfacht.

Der Produktions-Build läuft erfolgreich durch.

## 9. Startbildschirm und Interaktionshinweise entfernen

### Prompt

Der Startbildschirm ganz am Anfang ist ebenfalls unnötig. Die App sollte direkt zum
Modell springen. Auch das Wackeln und der virtuelle Mauszeiger, die zeigen sollen, dass
das Modell gezogen werden kann, sollten nicht vorhanden sein.

### Antwort

Erledigt:

- Der anfängliche Start-/Upload-Bildschirm wurde entfernt.
- Das Modell beginnt jetzt sofort zu laden.
- Das Wackeln als Interaktionshinweis wurde deaktiviert.
- Der virtuelle Zieh-Mauszeiger wurde entfernt.
- Der nicht mehr benötigte lokale Upload- und Drag-and-drop-Code wurde entfernt.

Der Produktions-Build läuft erfolgreich durch.

## 10. Regler für die Lichtrichtung

### Prompt

Können wir einen Regler hinzufügen, mit dem sich die Richtung der Lichtquelle einstellen
lässt?

### Antwort

Ein Regler **Lichtrichtung** mit einem Bereich von `0°` bis `360°` wurde hinzugefügt.

Er dreht die Studio-HDR-Beleuchtung um das Modell und gleicht dabei die Kamera aus,
sodass das Modell optisch an seiner Position bleibt. Beim Zurücksetzen der Ansicht bleibt
die gewählte Lichtrichtung erhalten.

Der Produktions-Build läuft erfolgreich durch.

## 11. Richtungsabhängige weiche Schatten

### Prompt

Wie sieht es mit Schatten aus? Können wir für das Modell weiche Schatten hinzufügen, die
von der Position der Lichtquelle abhängen?

### Antwort

Erledigt. Vectorapp verfügt jetzt über echte richtungsabhängige weiche Schatten:

- Der Regler für die Lichtrichtung dreht sowohl die HDR-Beleuchtung als auch das
  schattenwerfende Licht.
- Das Modell wirft weiche Boden- und Eigenschatten.
- Das Modell bleibt stehen, während sich die Beleuchtung bewegt.
- Die anfängliche Kameraausrichtung wurde verbessert.
- Die vorhandenen Steuerungen für Helligkeit und Tone Mapping bleiben unverändert.

Ich habe `<model-viewer>` durch Three.js ersetzt, weil dessen
[`DirectionalLight`](https://threejs.org/docs/pages/DirectionalLight.html) und
[Schattenkarten-Renderer](https://threejs.org/docs/pages/WebGLRenderer.html) die
benötigten gerichteten Schatten bereitstellen.

Die Darstellung wurde im Browser bei 0° und 180° überprüft, und `npm run build` läuft
erfolgreich durch. Lokal startest du die App mit:

```bash
npm run dev
```

Deine GLB-Datei enthält mehrere emissive Materialien. Daher sind die Bodenschatten klar
erkennbar, der Kontrast der Eigenschatten könnte sich mit dem nächsten Modellexport aber
noch weiter verbessern.

## 12. Fehlerhafte lokale Darstellung

### Prompt

**Erwähnte Datei:**
`/home/tapioka/Bilder/Bildschirmfotos/Bildschirmfoto vom 2026-08-25 17-52-09.png`

Das scheint nicht funktioniert zu haben. Die Seite sieht jetzt so aus.

### Antwort

Du hast recht – ich konnte den Fehler reproduzieren. Auf Port `5173` läuft ein alter
Vite-Prozess, der für Three.js den Fehler `504 Outdated Optimize Dep` zurückgibt. Dadurch
werden sowohl der Viewer als auch das zuvor importierte CSS nicht geladen.

Ich habe die App folgendermaßen aktualisiert:

- Vite erzwingt beim Start einen Neuaufbau der Abhängigkeits-Caches.
- CSS wird unabhängig geladen.
- Bei einem Fehler des Viewers wird eine hilfreiche Fehlermeldung angezeigt.
- Die Implementierung der gerichteten Schatten bleibt erhalten.

Starte die App lokal neu:

```bash
cd /home/tapioka/yas
npm install
npm run dev
```

Drücke zuerst in jedem Terminal, in dem noch der alte Server läuft, `Ctrl+C`. Öffne
anschließend genau die URL, die Vite ausgibt – wahrscheinlich
`http://localhost:5174/`, falls Port `5173` weiterhin belegt ist.

Ich habe überprüft, dass ein frisch gestarteter Server ohne Anwendungsfehler korrekt
rendert. Auch der Produktions-Build läuft erfolgreich durch.

## 13. Hosting auf Vercel einschließlich Modell

### Prompt

Wie kann ich diese Website einschließlich des Modells auf Vercel hosten?

### Antwort

Ja – das Modell ist bereits richtig angeordnet. Vite kopiert beim Produktions-Build
alles unter `public/`, daher gilt:

- `public/models/model.glb` wird zu `/models/model.glb`.
- Auch die Studio-HDR-Datei wird eingebunden.

Eine Datenbank, Vercel Blob Storage oder ein Server sind nicht erforderlich.
[Vite dokumentiert dieses Verhalten von `public/` hier](https://v8.vite.dev/guide/assets).

#### Empfohlen: GitHub → Vercel

Dieses Repository hat derzeit weder einen ersten Commit noch ein Git-Remote.

1. Erstelle ein leeres Repository auf GitHub, zum Beispiel `vectorapp`. Es kann privat
   sein.

2. Führe in `/home/tapioka/yas` Folgendes aus:

```bash
git add .
git commit -m "Initial Vectorapp"
git remote add origin https://github.com/YOUR-USERNAME/vectorapp.git
git push -u origin main
```

Die GLB- und HDR-Dateien werden zusammen mit der Website eingecheckt. `node_modules` und
`dist` dürfen nicht eingecheckt werden; sie sind bereits ausgeschlossen.

3. Melde dich bei [Vercel](https://vercel.com) an, wähle **New Project** und importiere
   das GitHub-Repository.

4. Vercel sollte Vite automatisch erkennen. Bestätige diese Einstellungen:

```text
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Es werden keine Umgebungsvariablen benötigt.

5. Klicke auf **Deploy**.

Vercel stellt eine URL wie diese bereit:

```text
https://vectorapp.vercel.app
```

Das Modell sollte außerdem direkt hier erreichbar sein:

```text
https://vectorapp.vercel.app/models/model.glb
```

Mit Git verbundene Projekte werden nach jeder Änderung, die auf den Produktions-Branch
gepusht wird, automatisch neu veröffentlicht. Die
[Dokumentation zu Vercel-Git-Deployments](https://vercel.com/docs/git) erläutert außerdem
automatische Vorschau- und Produktions-Deployments.

#### Das Modell später aktualisieren

Ersetze [model.glb](/home/tapioka/yas/public/models/model.glb) und führe anschließend
Folgendes aus:

```bash
git add public/models/model.glb
git commit -m "Update 3D model"
git push
```

Vercel erstellt die Website automatisch neu.

Dein Modell ist etwa 5,8 MB und die HDR-Datei etwa 1,7 MB groß. Damit liegen beide
deutlich unter Vercels derzeitiger Grenze von 100 MB für statische Uploads im Hobby-Tarif.
[Vercel-Limits](https://vercel.com/docs/limits).

Ein wichtiger Hinweis: Das GitHub-Repository kann zwar privat sein, die veröffentlichte
GLB-Datei muss jedoch öffentlich herunterladbar sein, damit die Browser der Besucher sie
darstellen können. Jeder mit der Website-URL könnte die Modelldatei speichern.

## 14. Schattenwurf zwischen Objekten

### Prompt

Können Objekte ebenfalls Schatten werfen?

### Antwort

Ja. Derzeit wirft und empfängt jedes Mesh Schatten, sodass Objekte Schatten auf den Boden
und aufeinander werfen können.

Die Einschränkung sind die stark emissiven Materialien deiner GLB-Datei: Sie bleiben
selbst im Schatten hell, wodurch Schatten zwischen Objekten schwer erkennbar sind. Ich
kann die Emissionsstärke beim Laden des Modells reduzieren. Dadurch sollten diese
Schatten deutlich klarer werden, ohne dass ein neuer Export erforderlich ist.

## 15. Geworfene Schatten deutlicher sichtbar machen

### Prompt

Bitte mach das. Versuche außerdem, die geworfenen Schatten so deutlich sichtbar wie
möglich zu machen.

### Antwort

Erledigt. Die Schatten sind jetzt bewusst kontrastreich:

- Jedes Mesh wirft und empfängt Schatten.
- Dünne und doppelseitige Geometrie wird zuverlässig berücksichtigt.
- Die Emissionsstärke wurde auf 8 % reduziert.
- Das HDR-Fülllicht wurde reduziert.
- Das gerichtete Hauptlicht ist deutlich stärker und steht tiefer, wodurch längere
  Schatten entstehen.
- Die Deckkraft der Bodenschatten wurde erhöht, wobei die weichen Kanten erhalten
  bleiben.

Ich habe die Bewegung der Schatten bei mehreren Lichtrichtungen ohne Browserfehler
überprüft. `npm run build` läuft erfolgreich durch. Die Änderungen befinden sich in
[src/main.js](/home/tapioka/yas/src/main.js).

## 16. Aktualisierungen zu Vercel übertragen

### Prompt

Wie kann ich Aktualisierungen zur Vercel-Bereitstellung pushen?

### Antwort

Dein Projekt ist bereits mit folgendem Repository verbunden:

```text
https://github.com/0xtapi/yasvec.git
```

Der normale Ablauf für Aktualisierungen ist:

```bash
cd /home/tapioka/yas
npm run build
git add .
git commit -m "Describe the update"
git push origin main
```

Wenn Vercel dieses GitHub-Repository importiert hat, erzeugt jeder Push auf `main`
automatisch ein neues Produktions-Deployment.
[Vercel-Git-Deployments](https://vercel.com/docs/git).

Dein letzter Commit `Improve shadows` wurde bereits gepusht – der lokale Branch `main`
und `origin/main` sind synchron. Sieh auf der Seite **Deployments** des Vercel-Projekts
nach; der Build sollte dort bereits laufen oder als **Ready** markiert sein.

Wenn nichts passiert, öffne **Vercel → Project Settings → Git** und bestätige:

```text
Repository: 0xtapi/yasvec
Production branch: main
```

Ersetze bei Modellaktualisierungen die GLB-Datei und pushe sie auf die gleiche Weise:

```bash
git add public/models/model.glb
git commit -m "Update model"
git push origin main
```

Alternativ kannst du ohne Git-Integration direkt veröffentlichen:

```bash
npx vercel link
npx vercel deploy --prod
```

Der Befehl mit `--prod` aktualisiert die Live-Produktionsbereitstellung.
[Dokumentation zur Vercel CLI](https://vercel.com/docs/cli/deploy).

## 17. Buchstaben und Zahlen auf Pins zur Kamera ausrichten

### Prompt

Ist es möglich, die Zahlen und Buchstaben auf den Pins des 3D-Modells so zu verändern,
dass sie immer dem Betrachter zugewandt sind? Können wir das auf App-Ebene umsetzen?

### Antwort

Umgesetzt. Alle 14 Buchstaben- und Zahlen-Pins:

- richten sich fortlaufend zur aktiven Kamera aus,
- bleiben aufrecht und an ihren ursprünglichen Pin-Positionen verankert,
- funktionieren von gegenüberliegenden Seiten und aus erhöhten Blickwinkeln,
- sind vom Schattenwurf ausgeschlossen, damit keine transparenten rechteckigen Artefakte
  entstehen.

Das Verhalten erkennt die exportierten Pin-Materialien automatisch, anstatt sich auf
feste Knotennummern zu verlassen. Ich habe mehrere Kamerawinkel ohne Browserfehler
überprüft, und der Produktions-Build läuft erfolgreich durch.

Zur Veröffentlichung:

```bash
git add .
git commit -m "Make model pins face the viewer"
git push origin main
```

## 18. Standardmäßige Lichtrichtung auf 30° setzen

### Prompt

Bitte korrigiere außerdem die Lichtrichtung so, dass sie standardmäßig auf 30° eingestellt
ist.

### Antwort

Erledigt. Die Lichtrichtung ist jetzt standardmäßig auf `30°` eingestellt; Regler und
angezeigter Wert sind synchronisiert. Der Produktions-Build läuft erfolgreich durch.
