# Jak edytować stronę FrameTrace — instrukcja

Strona żyje pod adresem: **https://frametrace-site.vercel.app**
Kod strony (wspólna wersja) jest tutaj: **https://github.com/dcu111/frametrace-site**
Każda zapisana i wysłana zmiana pojawia się na stronie **automatycznie po ~30 sekundach**.

---

## KROK 0 — Zaakceptuj zaproszenie (raz)

Dostałeś od GitHuba maila z zaproszeniem do repozytorium. Kliknij w nim **„Accept invitation"**.
Bez tego nie zapiszesz zmian. Link, jeśli mail zginął:
👉 https://github.com/dcu111/frametrace-site/invitations

---

## Jak działa wspólna wersja (WAŻNE)

GitHub to **wspólny „sejf"** z aktualną wersją strony. Ty i reszta zespołu macie każdy swoją kopię.
Żeby zawsze pracować na tej samej, najnowszej wersji, obowiązuje **jedna złota zasada**:

> ### 🔑 Zawsze kliknij „Sync” ZANIM zaczniesz edytować i PO tym, jak skończysz.

- **Sync przed pracą** = ściągasz najnowsze zmiany innych (żebyś nie pisał na starej wersji)
- **Sync po pracy** = wysyłasz swoje zmiany do wspólnej wersji (i na stronę)

Rada: nie edytujcie **tego samego pliku w tym samym czasie**. Podzielcie się plikami.

---

## Sposób A — edycja w przeglądarce (najprościej, bez instalacji)

1. Wejdź na: https://github.com/dcu111/frametrace-site
2. Naciśnij na klawiaturze klawisz **`.`** (kropka)
3. Otworzy się **VS Code w przeglądarce** — pełny edytor, nic nie instalujesz
4. Kliknij plik po lewej → zmień tekst
5. Po lewej ikona **Source Control** (gałązka) → wpisz krótki opis → **Commit & Push**
6. Gotowe — po ~30 s zmiana jest na stronie

---

## Sposób B — VS Code na komputerze

**Instalacja (raz):**
- VS Code: https://code.visualstudio.com
- Git: https://git-scm.com  (potrzebny, żeby VS Code łączył się z GitHubem)

**Pobranie projektu (raz):**
1. Otwórz VS Code → naciśnij `Ctrl+Shift+P`
2. Wpisz **Git: Clone** i zatwierdź
3. Wklej adres: `https://github.com/dcu111/frametrace-site.git`
4. Wybierz folder na dysku → **Open**
5. Gdy poprosi o logowanie — zaloguj się swoim kontem GitHub

**Codzienna edycja:**
1. **Sync Changes** (strzałki ↻ na dole) — pobierz najnowszą wersję
2. Kliknij plik po lewej i zmień tekst
3. Zapisz: `Ctrl + S`
4. Ikona **Source Control** (`Ctrl+Shift+G`) → wpisz opis zmiany → **✓ Commit**
5. **Sync Changes** — wyślij zmiany
6. Po ~30 s zmiana jest na żywo

---

## Które pliki co robią

| Plik | Co to jest |
|---|---|
| `index.html` | **Strona główna** — to, co widzi klient |
| `generator.html` | Generator Cyfrowych Paszportów Produktu |
| `p.html` | Wygląd pojedynczego paszportu (po zeskanowaniu QR) |
| `api/` | Funkcje w tle (publikacja, AI-Parser) — **nie ruszaj bez potrzeby** |
| `passports/` | Zapisane paszporty produktów |

W praktyce do zmian tekstów i wyglądu edytujesz pliki `.html`.

---

## Bezpieczeństwo i spokój

- **Klucze i hasła NIE są w tym projekcie** — siedzą w panelu Vercel. Możesz swobodnie edytować, nic wrażliwego tu nie ma.
- **Nic nie zepsujesz na stałe** — GitHub pamięta każdą wersję, zawsze można cofnąć.
- W razie wątpliwości: **edytuj tylko teksty** w plikach `.html`, resztę zostaw.
