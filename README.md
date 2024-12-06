# Kalendio App

## 🔍 Überblick
Kalendio ist eine innovative, kollaborative Kalender-App, die speziell für Schüler*innen der KSB entwickelt wurde. Mit Kalendio behalten alle Schüler*innen in ihrer Klasse einen perfekten Überblick über Hausaufgaben, Prüfungen und andere wichtige Termine. Die App bietet benutzerfreundliche Funktionen, die das gemeinsame Lernen und Planen erleichtern.

---

## 📂 **Projektstruktur**

### **Frontend**
- **Framework**: React (erstellt mit Vite)
- **Technologien**: JavaScript, React Router, Axios
- **Wichtige Dateien/Ordner**:
  - `src/`: Enthält Komponenten und Seiten
  - `public/`: Statische Dateien
  - `vite.config.js`: Konfigurationsdatei

### **Backend**
- **System**: Node.js mit Express
- **Genutzte Pakete**: `express`, `cors`, `body-parser`, `dotenv`
- **Struktur**:
  - `routes/`: API-Endpunkte (z. B. `exampleRoutes.js`)
  - `models/`: Datenstrukturen (z. B. `exampleModel.js`)
  - `controllers/`: Geschäftslogik (z. B. `exampleController.js`)
  - `config/`: (Optional) Datenbankverbindungen
  - `server.js`: Einstiegspunkt der Backend-Anwendung

 ---

## ⚙️ Funktionen

### 1. 📅 **Zusammenarbeitender Kalender**
- Alle Mitglieder einer Klasse können Termine und Aufgaben gemeinsam verwalten.
- Automatische Synchronisation, sodass alle immer auf dem neuesten Stand sind.

### 2. 🏆 **Ranking-System**
- Motiviert durch Rankings: Nutzer*innen können Punkte für das Hinzufügen und Bearbeiten von Einträgen sammeln.
- Die besten Teilnehmer*innen werden in einer Rangliste angezeigt.

### 3. 🔒 **Notizfunktion**
- Persönliche und Notizen direkt in Kalendio schreiben.
- Ideal für Aufgabenbeschreibungen oder zusätzliche Informationen.

### 4. **Termine bestätigen**
- Eine Funktion bei der man Termine und Einträge bestätigen kann
---

🚀 **Projekt starten**

Um das Kalendio-Projekt lokal auszuführen, folge diesen Schritten:

### **1. Backend starten**

Öffne ein Terminal und navigiere in den Ordner des Backends:

```bash
cd backend
```

Installiere die notwendigen Abhängigkeiten:

```bash
npm install
```

Starte den Server:

```bash
node server.js
```

Falls du dich manuell einloggen möchtest, führe zusätzlich folgenden Befehl aus:

```bash
node manualServer.js
```

### **2. Frontend starten**

Öffne ein neues Terminal und navigiere in den Ordner des Frontends:

```bash
cd frontend
```

Installiere die notwendigen Abhängigkeiten:

```bash
npm install
```

Starte den Entwicklungsserver:

```bash
npm run dev
```

---

## 🔖 Zielgruppe
Kalendio richtet sich speziell an Schüler*innen der KSB. Die App ist darauf ausgelegt, in jeder Klasse eine bessere Organisation und einen klaren Überblick über die Anforderungen des Schulalltags zu schaffen.

---

## 📢 Kontakt und Feedback
Wir freuen uns über dein Feedback und Vorschläge, um Kalendio noch besser zu machen. Kontaktiere uns gerne über:
- E-Mail: kalendio.sup@gmail.com

---

## 🖋 Autoren
- [Nicolas Haas](https://github.com/cpowern) 
- [Sophia Cuarte](https://github.com/SophiaCuarte) 
- [Carina Cordes](https://github.com/coerres)

