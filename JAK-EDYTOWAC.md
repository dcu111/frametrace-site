# Jak edytować stronę FrameTrace

Strona jest **na żywo** pod adresem: **https://frametrace-site.vercel.app**
Każda zapisana zmiana pojawia się na stronie automatycznie po ok. **30 sekundach**.

---

## Najszybszy sposób — edycja w przeglądarce (bez instalowania niczego)

1. Wejdź na repozytorium: https://github.com/dcu111/frametrace-site
2. Naciśnij na klawiaturze klawisz **`.`** (kropka)
3. Otworzy się **VS Code w przeglądarce** — pełny edytor, nic nie trzeba instalować
4. Edytuj plik → w panelu **Source Control** (ikona gałązki po lewej) wpisz krótki opis i kliknij **Commit & Push**
5. Gotowe — po ~30 s zmiana jest na stronie

---

## Wersja na komputerze — VS Code + Git

**Jednorazowa instalacja:**
- VS Code: https://code.visualstudio.com
- Git: https://git-scm.com

**Pobranie projektu (raz):**
1. W VS Code: `Ctrl+Shift+P` → wpisz **Git: Clone**
2. Wklej: `https://github.com/dcu111/frametrace-site.git`
3. Wybierz folder na dysku → **Open**

**Codzienna edycja:**
1. Kliknij plik po lewej i zmień tekst
2. Zapisz: `Ctrl + S`
3. Ikona **Source Control** (`Ctrl+Shift+G`) → wpisz opis zmiany → **✓ Commit**
4. Kliknij **Sync Changes** (albo strzałki ↑↓ na dole)
5. Po ~30 s zmiana jest na żywo

---

## Które pliki co robią

| Plik | Co to jest |
|---|---|
| `index.html` | **Strona główna** — to, co widzi klient |
| `generator.html` | Generator Cyfrowych Paszportów Produktu |
| `p.html` | Wygląd pojedynczego paszportu (po zeskanowaniu QR) |
| `api/` | Funkcje w tle (publikacja, AI-Parser) — **nie ruszaj bez potrzeby** |
| `passports/` | Zapisane paszporty produktów |

---

## Ważne

- **Klucze i hasła NIE są w tym projekcie** — siedzą bezpiecznie w panelu Vercel.
  Możesz swobodnie edytować stronę, nic wrażliwego tu nie ma.
- Jeśli coś przypadkiem zepsujesz — poprzednią wersję zawsze można przywrócić
  (GitHub pamięta całą historię zmian).
- W razie wątpliwości: **edytuj tylko teksty** w plikach `.html`, resztę zostaw.
