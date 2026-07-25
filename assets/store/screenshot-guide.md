# Google Play — Guida agli screenshot

Gli screenshot sono **l'unico asset dello store che deve venire dal tuo telefono**: icona, feature
graphic e testi sono già pronti nel repo. Questa guida elimina l'improvvisazione — cosa
inquadrare, in che ordine, con quali dati e cosa evitare.

> Gli screenshot sono il fattore che più incide sull'installazione: sulla scheda Play l'utente vede
> **i primi due** prima di dover scorrere. Quei due decidono.

---

## 1. Requisiti tecnici Play (telefono)

| Requisito | Valore |
|---|---|
| Numero | **minimo 2**, massimo 8 — carichane **6** |
| Formato | PNG o JPEG a 24 bit (**senza** canale alfa) |
| Lato minimo | 320 px · **lato massimo** 3840 px |
| Proporzioni | tra 16:9 e 9:16 — verticale per un'app portrait |
| Dimensione consigliata | **1080 × 1920** o **1080 × 2400** |
| Peso | max 8 MB per immagine |

Lo screenshot nativo di qualunque Android recente (1080 × 2340 o simile) rispetta già tutto: non
serve ritagliare né ridimensionare. **Non** aggiungere cornici del telefono, testo promozionale o
badge "Novità": Play li tollera ma abbassano la resa su schermo piccolo, e i mockup con cornice
rischiano il rifiuto se somigliano a un dispositivo di marca.

⚠️ **PNG senza alfa**: gli screenshot Android sono già senza trasparenza. Se li passi da un editor,
verifica di non aver introdotto un canale alfa (Play rifiuta l'upload).

---

## 2. Preparazione del telefono (10 minuti, fa la differenza)

1. **Installa la build più recente** — deve includere il refresh UI (tab bar Material 3 con la
   pillola, ModerationSheet) e il campo Nome in registrazione. Se non c'è, gli screenshot mostrano
   una UI vecchia: `eas update --channel preview --platform android` e riavvia l'app due volte.
2. **Account con dati veri, non vuoti.** Serve un profilo con **almeno 3-4 recensioni proprie** e
   qualche like ricevuto, altrimenti Profilo e Attività appaiono vuoti. Se il tuo account è povero,
   scrivi qualche recensione prima.
3. **Il nome utente deve essere impostato.** Gli account creati prima del fix hanno `full_name`
   nullo e compaiono come "Utente Autostradale": pessimo in uno screenshot della classifica.
   Verifica in Supabase → `profiles` e valorizza almeno i profili che finiranno in foto.
4. **Barra di stato pulita**: batteria carica (o almeno > 50%), Wi-Fi pieno, **niente icone di
   notifica**, silenzioso attivo. Le notifiche di WhatsApp nella status bar sono il difetto più
   comune negli screenshot amatoriali.
5. **Modalità aereo NO** — serve rete: mappa e recensioni devono essere caricate. Assicurati che
   la pillola offline **non** sia visibile.
6. **Luminosità alta** e tema chiaro (l'app è `userInterfaceStyle: light`, quindi è già coerente).

---

## 3. La shot list — 6 screenshot, in questo ordine

L'ordine è quello di caricamento su Play e conta: i primi due sono la vetrina.

### #1 — Mappa con pin e cluster ⭐ (il più importante)

- **Schermata:** Esplora (Home)
- **Come inquadrare:** zoom su una zona **riconoscibile e densa** — la Pianura Padana tra Milano e
  Bologna, oppure la Liguria di Ponente. Serve un mix visibile di **pin singoli e cluster
  numerati**: è ciò che comunica "il database è pieno".
- **Da evitare:** zoom a livello nazione (i pin scompaiono per il clustering, vedi `STATUS.md` §4);
  zoom troppo stretto (sembra che ci siano 3 aree in tutta Italia).
- **Verifica:** i pin devono essere **visibili e interi**. Se appaiono tagliati o mancanti, è il bug
  degli snapshot Android — non scattare, ricarica la schermata (vedi `CLAUDE.md` §4).

### #2 — Scheda area di servizio con pagelle ⭐

- **Schermata:** ServiceArea, aperta su un'area **con nome proprio** (es. "Somaglia Ovest"), mai su
  una delle ~1900 chiamate genericamente "Area di servizio".
- **Cosa deve entrare:** l'header arrotondato verde, il nome, le **pagelle con le emoji**
  (🚻☕💶🧼🍽️) e i chip dei servizi. Le pagelle sono la feature differenziante: devono vedersi.
- **Scorri** fino alla posizione in cui pagelle e servizi sono entrambi visibili.

### #3 — Lista recensioni con foto

- **Schermata:** Reviews di un'area con **almeno 3 recensioni**, di cui una **con fotografia** e un
  conteggio like > 0.
- **Perché:** dimostra che la community è viva. Una lista con una sola recensione comunica il
  contrario.
- ⚠️ **Controlla i contenuti**: nessuna volgarità, nessun nome di persona reale, nessuna targa
  o volto riconoscibile nelle foto. Questo screenshot è pubblico e permanente.

### #4 — "Vicino a te"

- **Schermata:** Home → FAB → bottom sheet delle aree vicine ordinate per distanza.
- **Cosa deve entrare:** il bottom sheet arrotondato con **più righe** e le distanze in km.
- ⚠️ **Privacy tua:** lo screenshot rivela dove eri. Scattalo da una posizione neutra (un'area di
  servizio, un centro città) — **non** da casa. Se necessario, scattalo durante un viaggio.

### #5 — Profilo con punti e livello

- **Schermata:** Profilo
- **Cosa deve entrare:** punti, livello raggiunto (meglio se non "Novellino del Casello": un livello
  intermedio comunica progressione), numero di recensioni, media stelle.
- **Non** includere l'indirizzo email se compare in chiaro: ritaglia o usa un account dedicato.

### #6 — Classifica top 20

- **Schermata:** Attività → tab Classifica
- **Cosa deve entrare:** almeno 5-6 righe con **nomi diversi e punteggi diversi**.
- ⚠️ **Blocco assoluto:** se le righe mostrano tutte "Utente Autostradale", **non caricare questo
  screenshot** — sostituiscilo con la ricerca/filtri. Prima valorizza i nomi in `profiles`
  (vedi punto 3 della preparazione).

### Riserve, se uno dei sei non viene bene

- **Filtri e ricerca**: Home con il pannello filtri aperto e qualche chip servizio selezionato in ambra
- **Preferiti**: Attività → tab Preferiti, con 3+ aree salvate
- **Scrittura recensione**: AddReview con stelle e pagelle in compilazione

---

## 4. Come catturare

**Sul telefono:** Volume giù + Accensione insieme. I file finiscono in `DCIM/Screenshots`.

**Da Mac con il telefono collegato** (più comodo, salva direttamente sul computer):

```bash
# uno screenshot, direttamente nella cartella corrente
adb exec-out screencap -p > screenshot-1.png

# oppure: cattura sul telefono e poi scarica tutto
adb pull /sdcard/DCIM/Screenshots ./screenshots-play
```

**Verifica dimensioni e assenza di canale alfa:**

```bash
# macOS
file screenshot-1.png && sips -g pixelWidth -g pixelHeight screenshot-1.png
```

Se `file` riporta `RGBA`, riconverti in RGB prima di caricare:

```bash
sips -s format png --matchTo '/System/Library/ColorSync/Profiles/sRGB Profile.icc' screenshot-1.png
```

---

## 5. Dove caricarli

Play Console → **Cresci → Presenza sullo Store → Scheda principale dello Store** → sezione
*Screenshot del telefono*. Trascina i 6 file **nell'ordine** della shot list: l'ordine di
caricamento è l'ordine di visualizzazione, e si può riordinare dopo con drag & drop.

Nella stessa pagina servono anche:
- **Icona** 512 × 512 → da `assets/icon.png` (Play ridimensiona il 1024)
- **Immagine in evidenza** 1024 × 500 → `assets/store/feature-graphic.png`
- **Titolo, descrizione breve e lunga** → `assets/store/listing.md`

---

## 6. Checklist finale prima di caricare

- [ ] 6 screenshot, verticali, 1080 px di larghezza o più
- [ ] PNG a 24 bit senza canale alfa, sotto 8 MB ciascuno
- [ ] Nessuna icona di notifica nella barra di stato
- [ ] La pillola offline non è visibile in nessuno
- [ ] Nessun indirizzo email, nome di persona reale, targa o volto riconoscibile
- [ ] Nessuna recensione con linguaggio inappropriato in vista
- [ ] I pin della mappa sono interi, non tagliati
- [ ] La classifica non mostra "Utente Autostradale" ripetuto
- [ ] Lo screenshot "Vicino a te" non rivela la tua abitazione
- [ ] La UI è quella aggiornata (tab bar con pillola Material 3)
