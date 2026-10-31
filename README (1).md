# QWERTYMC — strona serwera Minecraft

Statyczna strona (HTML + CSS + czysty JavaScript). Bez bibliotek, bez instalacji, bez kroku budowania.

## Uruchomienie lokalnie

Najprościej: otwórz plik `index.html` w przeglądarce.

Albo przez lokalny serwer:

```bash
cd qwertymc
python3 -m http.server 8080
# potem: http://localhost:8080
```

## Struktura

```
qwertymc/
├── index.html        # cała treść: hero, rangi, klucze i zestawy, regulamin
├── favicon.svg       # pikselowe „Q” na klawiszu
├── css/style.css     # cały wygląd (zmienne kolorów na górze pliku)
└── js/main.js        # kopiowanie IP, klawisze, przełącznik cen, regulamin
```

## Co jest gdzie

- **Dane serwera** (IP, Discord, wersja): w `index.html`. IP występuje w atrybutach `data-copy`
  i w tekście, Discord w kilku linkach — najłatwiej zamienić przez „znajdź i zamień”.
- **Ceny rang**: atrybuty `data-p30` / `data-p356` przy `.price-num` (oraz tekst `.price-alt`).
- **Regulamin**: sekcje `.group` w `index.html`, numeracja jest wpisana ręcznie (`data-n`),
  dzięki czemu zgodna z oryginałem. Punkt 5 jest oznaczony jako brakujący.
- **Kolory**: zmienne `:root` na początku `css/style.css` (`--accent`, `--vip`, `--elita`, `--sponsor`).

## Czcionki

Strona ładuje Pixelify Sans, Bricolage Grotesque i JetBrains Mono z Google Fonts.
Bez internetu użyje czcionek zapasowych (układ działa, wygląd jest tylko mniej dopracowany).

## Ciekawostka

Kliknij klawisze w logo albo wpisz `QWERTYMC` na klawiaturze.
